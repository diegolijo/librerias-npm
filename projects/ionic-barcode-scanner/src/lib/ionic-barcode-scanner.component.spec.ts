import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IonicBarcodeScannerComponent } from './ionic-barcode-scanner.component';

describe('IonicBarcodeScannerComponent', () => {
  let component: IonicBarcodeScannerComponent;
  let fixture: ComponentFixture<IonicBarcodeScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IonicBarcodeScannerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IonicBarcodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
