import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


import { AgGridModule } from 'ag-grid-angular';
import { HttpClientModule } from '@angular/common/http';
import { DragAndDropComponent } from './drag-and-drop/drag-and-drop.component';
import { GridComponent } from './grid/grid.component';

import { FileUploadModule } from 'ng2-file-upload';
import { UploadComponent } from './upload/upload.component'


@NgModule({
  declarations: [
    AppComponent,
    DragAndDropComponent,
    GridComponent,
    UploadComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AgGridModule.withComponents([]),
    HttpClientModule,
    FileUploadModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
