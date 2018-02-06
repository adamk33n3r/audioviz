import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'audioviz-file',
  templateUrl: './audio-file.component.html',
  styleUrls: ['./audio-file.component.css']
})
export class AudioFileComponent implements OnInit {

  @Output()
  public file = new EventEmitter();

  constructor() { }

  public ngOnInit() {
  }

  public onFileChange(event: Event) {
    this.file.emit((<HTMLInputElement>event.target).files[0]);
  }
}
