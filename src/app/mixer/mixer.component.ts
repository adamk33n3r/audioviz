import { Component, OnInit } from '@angular/core';
import { Track } from '../audio/mixer';

@Component({
  selector: 'av-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.css']
})
export class MixerComponent implements OnInit {

  public tracks: Track[] = [];

  constructor() { }

  ngOnInit() {
  }

}
