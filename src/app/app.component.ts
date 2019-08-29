import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { TagLabel, formatLabels, commonLabels } from './drag-and-drop/format-tags';

import * as mm from 'music-metadata-browser';


interface IValue {
  text: string;
  ref?: string;
}

interface ITagText {
  key: string;
  label: IValue;
  value: IValue[];
}

interface IUrlAsFile {
  name: string;
  type: string;
}

interface IFileAnalysis {
  file: File | IUrlAsFile;
  metadata?: mm.IAudioMetadata;
  parseError?: Error;
}

interface ITagList {
  title: string;
  key: string;
  tags?: ITagText[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


  public results: IFileAnalysis[];

  public nativeTags: {type: string, tags: {id: string, value: string}[]}[] = [];

  public tagLists: ITagList[] = [{
    title: 'Format',
    key: 'format'
  }, {
    title: 'Generic tags',
    key: 'common'
  }];


  @ViewChild('agGrid') agGrid: AgGridAngular;

  title = 'app';

  columnDefsBottom = [
      {headerName: 'Make', field: 'make', sortable: true, filter: true, checkboxSelection: true },
      {headerName: 'Model', field: 'model', sortable: true, filter: true },
      {headerName: 'Price', field: 'price', sortable: true, filter: true }
  ];

  columnDefsUpper = [
    {headerName: 'Title', field: 'common.title', sortable: true, filter: true, checkboxSelection: true },
    {headerName: 'Album', field: 'common.album', sortable: true, filter: true },
    {headerName: 'Artist', field: 'common.artist', sortable: true, filter: true },
    {headerName: 'Year', field: 'common.year', sortable: true, filter: true }
  ];

  rowDataUpperTable: any;
  rowDataBottomTable: any;

  err: any;

  constructor(private http: HttpClient, private zone: NgZone,) {

  }

  ngOnInit() {
      this.rowDataBottomTable = this.http.get('https://api.myjson.com/bins/15psn9');
  }

  onFirstDataRendered(params) {
    params.api.sizeColumnsToFit();
  }

  public handleFilesDropped(files: File[]) {
    this.results = []; // initialize results
    this.parseFiles(files);
    console.log('handleFilesDropped', {files});
  }

  public handleTextDropped(text) {
    this.results = []; // initialize results
    if (text.indexOf('http') === 0) {
      return this.parseUsingHttp(text);
    } else {
    }
  }

  public handleFilesEnter(event) {
    console.log('handleFilesEnter', event);
  }

  public handleFilesLeave(event) {
    console.log('handleFilesLeave', event);
  }

  private prepareTags(labels: TagLabel[], tags): ITagText[] {
    return labels.filter(label => tags.hasOwnProperty(label.key)).map(label => {
        const av = Array.isArray(tags[label.key]) ? tags[label.key] : [tags[label.key]];
        return {
          key: label.key,
          label: {text: label.label, ref: label.keyRef},
          value: av.map(v => {
            return {
              text: label.toText ? label.toText(v) : v,
              ref: label.valueRef ? label.valueRef(v) : undefined
            };
          })
        };
      }
    );
  }

  private prepareNativeTags(tags): {type: string, tags: {id: string, value: string}[]}[] {
    return Object.keys(tags).map(type => {
      return {
        type,
        tags: tags[type]
      };
    });
  }

  private parseUsingHttp(url: string): Promise<void> {
    console.log('Converting HTTP to stream using: ' + url);

    const file: IUrlAsFile = {
      name: url,
      type: '?'
    };

    const result: IFileAnalysis = {
      file
    };
    this.results.push(result);

    return mm.fetchFromUrl(url, {native: true}).then(metadata => {

      this.zone.run(() => {

        console.log('Completed parsing of %s:', file.name, metadata);
        result.metadata = metadata;
        this.tagLists[0].tags = this.prepareTags(formatLabels, metadata.format);
        this.tagLists[1].tags = this.prepareTags(commonLabels, metadata.common);
        this.nativeTags = this.prepareNativeTags(metadata.native);
      });
    }).catch(err => {
      this.zone.run<void>(() => {
        console.log('Error: ' + err.message);
        result.parseError = err.message;
      });
    }) as any;
  }

  private parseFiles(files: File[]): Promise<void> {
    const file: File = files.shift();
    if (file) {
      console.log('Start parsing file %s', file.name);
      return this.parseFile(file).then(() => {
        return this.parseFiles(files);
      });
    }
  }

  private parseFile(file: File): Promise<void> {
    console.log('Parsing %s of type %s', file.name, file.type);
    const result: IFileAnalysis = {
      file
    };
    this.results.push(result);
    return mm.parseBlob(file, {native: true}).then(metadata => {
      this.zone.run(() => {
        console.log('Completed parsing of %s:', file.name, metadata);
        result.metadata = metadata;
        this.rowDataUpperTable = metadata; // assigning metadata to upper table dataset
        this.tagLists[0].tags = this.prepareTags(formatLabels, metadata.format);
        this.tagLists[1].tags = this.prepareTags(commonLabels, metadata.common);
        this.nativeTags = this.prepareNativeTags(metadata.native);
      });
    }).catch(err => {
      this.zone.run<void>(() => {
        console.log('Error: ' + err.message);
        result.parseError = err.message;
        this.err = err;
      });
    });
  }

}
