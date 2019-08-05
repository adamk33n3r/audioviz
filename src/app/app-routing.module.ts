import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DawComponent } from './daw/daw.component';
import { VisualizerComponent } from './visualizer/visualizer.component';


const routes: Routes = [
  {
    path: '',
    component: VisualizerComponent,
  },
  {
    path: 'daw',
    component: DawComponent,
  },
];

@NgModule({
  imports: [
      RouterModule.forRoot(routes)
  ],
  exports: [
      RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }

