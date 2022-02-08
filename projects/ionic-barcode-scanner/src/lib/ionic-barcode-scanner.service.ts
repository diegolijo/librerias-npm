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

/**
 *  @name BarcodeScanner
 *  
 *  @description
 *  Servicio angular para controlar el plugin Cordova: `bardode-scan`.
 * 
 *  @usage
 * ```typescript
 *  import { Device } from '@awesome-cordova-plugins/device/ngx';
 *  import { BarcodeScanner } from 'angular-barcode-scanner';
 *  
 *  constructor(
 *    private barcodeScanner: BarcodeScanner,
 *    private device: Device
 *    ) {}
 *
 *  ...
 *  await this.barcodeScanner.setBarcodeDevice(this.device.model);
 * 
 *  ...
 *  this.scannerProvider.scanBarcode().then((result)=>{
 *       console.log(result);
 *    });
 * 
 *  
 *  ...
 *  this.barcodeScanner.subscrbeToScan(this.subscribeKey,
 *     async (value) => {
 *       this.callbackFunction(value.result);
 *     }, (err) => {
 *       console.log(err);
 *     });
 * 
 *  ...
 *  this.barcodeScanner.unSubscrbeToScan(this.subscribeKey);
 * 
 */
@Injectable()
export class BarcodeScanner {

  /**
   * flags de los eventos
   */
  public static readonly EVENT_SCAN: string = 'barcode-scanner-scan';
  public static readonly EVENT_ENABLE: string = 'barcode-scanner-enable';
  public static readonly EVENT_DISABLE: string = 'barcode-scanner-disable';
  public static readonly EVENT_GET_DEVICES: string = 'barcode-scanner-get-devices';

  // lista de los modelos del plugin, y nuevos modelos asociados con alguno de los anteriores
  private readonly compatibleHardware: any[] = [
    // modelos del plugin
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
   * Selecciona el tipo de scanner según el modelo del dispositivo (this.device.model)
   * y habilita el lector hardware
   * declara un Subject<IScanEvent> al que podemos subscribirnos con .subscrbeToScan(...)
   * 
   * @param device el modelo del disposiivo proporcionado por '@awesome-cordova-plugins/device/ngx
   */
  public async setBarcodeDevice(model: string) {
    this.hardware = await this.getPluginModel(model);
    await this.enableScan(this.hardware);
  }



  /**
   * Inicia una lectura del lector hardware o lanza la camara.
   * Cada vez que se produce un escaneo se propaga un Subject<IScanEvent>
   * 
   * @returns la lectura del scanner 
   */
  public async scanBarcode() {
    return await this.scan(this.hardware);
  }

 /**
  * Declana un nuevo observable para escuchar los eventos del scanner
  * @param id id único para declarar el observable. Si ya fue utilizado anteriormente y la subscripción está activa se aborta la operación
  * @param callbackFunction 
  * @param errorFunction 
  */
  public subscrbeToScan(id: string, callbackFunction: any, errorFunction: any) {
    try {
      const element = this.subscribes[id];
      let subscriber: any;
      if (!element || (element.key === id && element.subscriber.closed)) {
        subscriber = this.scanSubject.asObservable().subscribe((value) => {
          this.ngZone.run(() => {
            callbackFunction(value);
          });
        });
        this.subscribes[id] = {
          subscriber: subscriber,
          key: id
        };
      }
    } catch (err) {
      errorFunction(err);
    }
  }

/**
 * Se cancela el subscribe activo declarado con el id proporcionado
 * @param id id del observable para cancelar la subscripción
 */
  public unSubscrbeToScan(id: string) {
    if (this.subscribes[id] && !this.subscribes[id].subscriber.closed) {
      this.subscribes[id].subscriber.unsubscribe();
      delete this.subscribes[id];
    };
  }



  /*********************************************************************************************************/

  private async getPluginModel(nativeModel: string): Promise<string> {
    await this.platform.ready();
    return new Promise(async (resolve, reject) => {
      try {
        let model = 0; // TODO comprobar que el dispositivo tiene camara
        const pluginDevices: any = await this.getDevices();
        const result = this.compatibleHardware.find(element => element.model === nativeModel);
        if (result) {
          model = result.index;
          resolve(pluginDevices[model]);
        }
      } catch (err) {
        reject(err);
      }
    });
  }


  private getDevices() {
    if (!this.platform.is('cordova')) {
      const res = ['camera'];
      this.scanSubject.next({ flag: BarcodeScanner.EVENT_GET_DEVICES, result: res });
      return (res);
    }
    if (this.platform.is('cordova')) {
      return new Promise((resolve: any, reject: any) => {
        cordova.plugins.BarcodeScan.getDevices((res: any) => {
          this.scanSubject.next({ flag: BarcodeScanner.EVENT_GET_DEVICES, result: res });
          resolve(res);
        }, (err: any) => {
          reject(err);
        });
      });
    } else {
      return 'camera';
    }
  }


  private enableScan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      if (!this.platform.is('cordova')) {
        const msg = 'Scanner plugin not available';
        reject(msg);
      }
      if (this.platform.is('cordova')) {
        cordova.plugins.BarcodeScan.enable(device, async (value: any) => {
          if (device !== 'camera') {
            if (value.text) {
              this.scanSubject.next({ flag: BarcodeScanner.EVENT_ENABLE, result: value.text });
            }
          }
          resolve(value.text);
        }, (err: any) => {
          reject(err);
        });
      }
    });
  }

  private disableScan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      if (!this.platform.is('cordova')) {
        const msg = 'Scanner plugin not available';
        reject(msg);
      }
      cordova.plugins.BarcodeScan.enable(device, (res: any) => {
        this.scanSubject.next({ flag: BarcodeScanner.EVENT_DISABLE, result: res });
        resolve(true);
      }, (err: any) => {
        reject(err);
      });
    });
  }

  private scan(device: any) {
    return new Promise((resolve: any, reject: any) => {
      if (!this.platform.is('cordova')) {
        const msg = 'Scanner plugin not available';
        reject(msg);
      }
      else {
        cordova.plugins.BarcodeScan.scan(device, (value: any) => {
          if (value.text) {
            this.scanSubject.next({ flag: BarcodeScanner.EVENT_SCAN, result: value.text });
          }
          resolve(value.text);
        }, (err: any) => {
          reject(err);
        });
      }
    });
  }


}
