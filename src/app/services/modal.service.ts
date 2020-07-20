import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  @Output() open: EventEmitter<string> = new EventEmitter();

  constructor() {
  }

  openModal(modal: string) {
    this.open.emit(modal);
  }

  closeModal() {
    this.open.emit();
  }
}
