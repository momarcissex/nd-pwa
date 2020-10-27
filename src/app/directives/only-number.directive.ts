import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[OnlyNumber]'
})
export class OnlyNumberDirective {

  constructor() { }

  @HostListener('keydown', ['$event']) onKeyDown(event) {
    console.log('working')
    let e = <KeyboardEvent>event;
    if (['Delete', 'Backspace', 'Tab', 'Escape', 'Enter', '.'].indexOf(e.key) !== -1 ||
      // Allow: Ctrl+A
      (e.key == 'a' && e.ctrlKey === true) ||
      // Allow: Ctrl+C
      (e.key == 'c' && e.ctrlKey === true) ||
      // Allow: Ctrl+V
      (e.key == 'v' && e.ctrlKey === true) ||
      // Allow: Ctrl+X
      (e.key == 'x' && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.key == 'Home') || (e.key == 'End') || (e.key == 'ArrowLeft') || (e.key == 'ArrowRight')) {
      // let it happen, don't do anything
      return;
    }

    if (e.key !== '0' && e.key !== '1' && e.key !== '2' && e.key !== '3' && e.key !== '4' && e.key !== '5' && e.key !== '6' && e.key !== '7' && e.key !== '8' && e.key !== '9') {
      e.preventDefault()
    }
  }

}
