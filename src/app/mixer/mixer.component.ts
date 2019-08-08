import { Component, OnInit, Input } from '@angular/core';
import { Track, Mixer } from '../audio/mixer';

@Component({
  selector: 'av-mixer',
  templateUrl: './mixer.component.html',
  styleUrls: ['./mixer.component.css']
})
export class MixerComponent implements OnInit {

  @Input()
  private mixer: Mixer;

  public tracks: Track[] = [];

  constructor() { }

  public ngOnInit() {
    this.tracks.push(this.mixer.masterTrack);
    this.tracks.push(this.mixer.createNewTrack());
    // this.tracks.push(this.mixer.createNewTrack());
    // this.tracks.push(this.mixer.createNewTrack());
  }

}
