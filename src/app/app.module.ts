import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { AudioFileComponent } from './audio-file/audio-file.component';
import { MixerComponent } from './mixer/mixer.component';
import { MixerTrackComponent } from './mixer-track/mixer-track.component';


@NgModule({
  declarations: [
    AppComponent,
    AudioFileComponent,
    MixerComponent,
    MixerTrackComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
