import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { AppComponent } from './app.component';
import { AudioFileComponent } from './audio-file/audio-file.component';
import { MixerComponent } from './mixer/mixer.component';
import { MixerTrackComponent } from './mixer-track/mixer-track.component';
import { MaterialModule } from './material.module';
import { AppRoutingModule } from './app-routing.module';
import { DawComponent } from './daw/daw.component';
import { VisualizerComponent } from './visualizer/visualizer.component';


@NgModule({
  declarations: [
    AppComponent,
    VisualizerComponent,

    AudioFileComponent,
    MixerComponent,
    MixerTrackComponent,

    DawComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,

    MaterialModule,

    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
