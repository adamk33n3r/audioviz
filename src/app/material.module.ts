import { NgModule } from '@angular/core';
import {
    MatButtonModule,
    MatSliderModule,
    MatSelectModule,
} from '@angular/material';

@NgModule({
    exports: [
        MatButtonModule,
        MatSliderModule,
        MatSelectModule,
    ],
})
export class MaterialModule {}
