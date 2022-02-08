/* eslint-disable max-len */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subject } from 'rxjs';
/* import { Log } from './log'; */

declare const cordova: any;
export interface IScanEvent {
  flag: string;
  result: any;
}

export interface ISubscriber {
  urlPage: string;
  subscriber: any;
}

@Injectable()
export class ScannerProvider {
  
  public static readonly EVENT_SCAN: string = 'barcode-scanner-scan';
  public static readonly EVENT_ENABLE: string = 'barcode-scanner-enable';
  public static readonly EVENT_DISABLE: string = 'barcode-scanner-disable';
  public static readonly EVENT_GET_DEVICES: string = 'barcode-scanner-get-devices';
  public static readonly EVENT_DEVICE_CHANGED: string = 'barcode-scanner-device-changed';
  public static readonly EVENT_SCAN_MODE_CHANGED: string = 'barcode-scanner-scan-mode-changed';

  /**
   * lista de los modelos del plugin, y nuevos modelos asociados con alguno de los anteriores
   */
  public readonly compatibleHardware: any[] = [
    // modelos del plugin
    // { model: 'camera', index: 0 },
    { model: 'c4050', index: 1 },
    { model: 'NQuire300', index: 2 },
    { model: 'EDA50K', index: 3 },
    { model: 'ZebraMC33', index: 4 },
    { model: 'UnitechEA300', index: 5 },
    // modelos correlativos
    { model: 'EA300', index: 5 },
    { model: 'NQ300', index: 2 },
    { model: 'TC20', index: 4 }
  ];




  private scanSubject = new Subject<IScanEvent>();
  private subscribes: any = {};
  private CLASS_NAME = 'ScannerProvider';
  private hardware = 'camera';

  constructor(
    private platform: Platform,
    private ngZone: NgZone
  ) { }


  /**
   * selecciona el tipo de scanner segun el modelo del dispositivo (this.device.model)
   * Habilita el lector hardware / camara del dispositivo
   * declara un evento en la plataforma nativa.
   * cada vez que se produce un escaneo se propaga un Subject<IScanEvent>
   *
   * @param device un dispositivo [compatibleHardware] proporcionado por getPluginModel()
   * @returns la lectura del scanner / '' cuando se declara.
   */
  public async setBarcodeDevice(model: string) {
    this.hardware = await this.getPluginModel(model);
    await this.enableScan(this.hardware);
  }


  public subscrbeToScan(urlPage: string, functionAccept: any, functionCancel: any) {
    try {
      const element = this.subscribes[urlPage];
      let subscriber: any;
      //   Log.color(urlPage, 'orange', 'intentamos subcribirnos en: ');
      if (!element || (element.urlPage === urlPage && element.subscriber.closed)) {
        //      Log.color(urlPage, 'green', 'subscrbeToScan() en ');
        subscriber = this.scanSubject.asObservable().subscribe((value) => {
          this.ngZone.run(() => {
            functionAccept(value);
          });
        });
        this.subscribes[urlPage] = {
          subscriber: subscriber,
          urlPage: urlPage
        };
      }
      //   Log.color((Object.keys(this.subscribes).length ? Object.keys(this.subscribes).length : 0), 'blue', 'subscribes activos: ');
    } catch (err) {
      functionCancel(err);
    }
  }


  public unSubscrbeToScan(urlPage: string) {
    //  Log.color(urlPage, 'orange', 'intentamos desubcribirnos en: ');
    if (this.subscribes[urlPage] && !this.subscribes[urlPage].subscriber.closed) {
      //  Log.color(urlPage, 'red', 'unSubscrbeToScan() ');
      this.subscribes[urlPage].subscriber.unsubscribe();
      delete this.subscribes[urlPage];
    };
    //    Log.color((Object.keys(this.subscribes).length ? Object.keys(this.subscribes).length : 0), 'blue', 'subscribes activos: ');
  }


  public async scanBarcode() {
    await this.scan(this.hardware);
  }


  /**
   * comprueba si el modelo del dispositivo tiene hardware compatible con el plugin
   * en caso contrario retorna 'camera'
   *
   * @param nativeModel cordova.Device.model
   * @returns  compatibleHardware[1-5] / 'camera'
   */
  private async getPluginModel(nativeModel: string): Promise<string> {
    await this.platform.ready();
    return new Promise(async (resolve, reject) => {
      try {
        let model = 0; // TODO comprobar que el dispositivo tiene camara
        const pluginDevices: any = await this.getDevices();
        console.log('scaner.getDevices(): ' + JSON.stringify(pluginDevices));
        const result = this.compatibleHardware.find(element => element.model === nativeModel);
        if (result) {
          model = result.index;
        }
        console.log('hardware: ' + pluginDevices[model]);
        resolve(pluginDevices[model]);
      } catch (err) {
        reject(err);
      }
    });
  }


  private getDevices() {
    if (!this.platform.is('cordova')) {
      const res = ['camera'];
      console.log('getDevices -> Result:' + res, this.CLASS_NAME, {});
      this.scanSubject.next({ flag: ScannerProvider.EVENT_GET_DEVICES, result: res });
      return (res);
    }
    if (this.platform.is('cordova')) {
      return new Promise((resolve: any, reject: any) => {
        cordova.plugins.BarcodeScan.getDevices((res: any) => {
          console.log('getDevices -> Result:' + res, this.CLASS_NAME, {});
          this.scanSubject.next({ flag: ScannerProvider.EVENT_GET_DEVICES, result: res });
          resolve(res);
        }, (err: any) => {
          console.log(err, this.CLASS_NAME, {});
          reject(err);
        });
      });
    } else {
      return 'camera';
    }
  }





  /*********************************************************************************************************/

  private enableScan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      console.log('enableScan (device):' + device);
      if (!this.platform.is('cordova')) {
        const msg = 'Scanner plugin not available';
        console.log(msg, this.CLASS_NAME, {});
        reject(msg);
      }
      if (this.platform.is('cordova')) {
        cordova.plugins.BarcodeScan.enable(device, async (value: any) => {
          if (device !== 'camera') {
            console.log(ScannerProvider.EVENT_ENABLE + ': ' + device);
            if (value.text) {
              this.scanSubject.next({ flag: ScannerProvider.EVENT_ENABLE, result: value.text });
            }
          }
          //     Log.color(value.text, 'purple', 'Scan() ');
          resolve(value.text);
        }, (err: any) => {
          console.log(err, this.CLASS_NAME, {});
          reject(err);
        });
      }
    });
  }

  private disableScan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      if (!this.platform.is('cordova')) {
        const msg = 'Scanner plugin not available';
        console.log(msg, this.CLASS_NAME, {});
        reject(msg);
      }
      cordova.plugins.BarcodeScan.enable(device, (res: any) => {
        const msg = 'disable scan';
        console.log(msg, this.CLASS_NAME, {});
        this.scanSubject.next({ flag: ScannerProvider.EVENT_DISABLE, result: res });
        resolve(true);
      }, (err: any) => {
        console.log(err, this.CLASS_NAME, {});
        reject(err);
      });
    });
  }

  private scan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      if (!this.platform.is('cordova')) {

        const msg = 'Scanner plugin not available';
        console.log(msg, this.CLASS_NAME, {});
        reject(msg);
      }
      else {
        cordova.plugins.BarcodeScan.scan(device, (value: any) => {
          if (value.text) {
            console.log('scan -> Result:' + value, this.CLASS_NAME, {});
            this.scanSubject.next({ flag: ScannerProvider.EVENT_SCAN, result: value.text });
          }
          resolve(value.text);
        }, (err: any) => {
          console.log(err, this.CLASS_NAME, {});
          reject(err);
        });
      }
    });
  }


}
