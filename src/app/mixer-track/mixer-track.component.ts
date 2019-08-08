import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Track } from '../audio/mixer';
import { gainToDb, dbToGain } from '../audio/utils';

@Component({
  selector: 'av-mixer-track',
  templateUrl: './mixer-track.component.html',
  styleUrls: ['./mixer-track.component.css']
})
export class MixerTrackComponent implements OnInit {

  @Input()
  public track: Track;

  public get db(): number {
    if (!this.track) return 0;
    return Math.round(gainToDb(this.track.gain.value));
  }

  public set db(db: number) {
    this.track.gain.value = dbToGain(db);
  }

  public leftDb: Observable<number>;
  public rightDb: Observable<number>;

  constructor() { }

  public ngOnInit() {
    this.leftDb = this.track.dbSubject.pipe(map((db) => db[0]));
    this.rightDb = this.track.dbSubject.pipe(map((db) => db[1]));
  }

}
