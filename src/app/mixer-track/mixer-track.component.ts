import { Component, OnInit, Input } from '@angular/core';

import { Track } from '../audio/mixer';

@Component({
  selector: 'av-mixer-track',
  templateUrl: './mixer-track.component.html',
  styleUrls: ['./mixer-track.component.css']
})
export class MixerTrackComponent implements OnInit {

  @Input()
  public track: Track;

  @Input()
  public number: number;

  public gain: number;

  constructor() { }

  ngOnInit() {
  }

}
