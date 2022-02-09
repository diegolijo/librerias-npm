import { TestBed } from '@angular/core/testing';

import { BarcodeScanner } from './ionic-barcode-scanner.service';

describe('ScannerProvider', () => {
  let service: BarcodeScanner;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarcodeScanner);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
