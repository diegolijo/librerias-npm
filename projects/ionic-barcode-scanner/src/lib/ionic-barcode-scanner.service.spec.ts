import { TestBed } from '@angular/core/testing';

import { ScannerProvider } from './ionic-barcode-scanner.service';

describe('ScannerProvider', () => {
  let service: ScannerProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScannerProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
