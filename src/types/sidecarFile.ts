import { DateTime } from "luxon";

import { sideCarFileDetails } from "./sideCarFileDetails";

/*
TakenAt: 2003-07-11T14:08:33Z
TakenSrc: meta
UID: pra8dk339xe61swy
Type: video
Title: Seashore / 2003
OriginalName: random-video/Bike/Vietnam 2017/desktop maybe/test/VIDO0018
Year: 2003
Month: 7
Day: 11
Quality: 3
Favourite: true
Private: true
Details:
  Keywords: bike, brown, desktop, maybe, random, seashore, test, video, vietnam
CreatedAt: 2022-04-12T14:28:51Z
UpdatedAt: 2022-08-05T18:06:59.585384018Z
DeletedAt: 2022-08-05T18:06:59.585384018Z
*/

// Can't just have `TakenAt: DateTime` as it will just be parsed as a Date at runtime
export interface SidecarFileRaw {
    TakenAt: Date;
    TakenSrc: string;
    UID: string;
    Type: string;
    Title: string;
    OriginalName: string;
    Year: number;
    Month: number;
    Day: number;
    Quality: number;
    Favourite: boolean;
    Private: boolean;
    Details: sideCarFileDetails;
    CreatedAt: Date;
    UpdatedAt: Date;
    DeletedAt: Date;
}

export class SidecarFile implements SidecarFileRaw {
  constructor(obj: SidecarFileRaw) {
    this.TakenAt = obj.TakenAt
    this.TakenAtDateTime = DateTime.fromJSDate(obj.TakenAt)
    this.TakenSrc = obj.TakenSrc
    this.UID = obj.UID
    this.Type = obj.Type
    this.Title = obj.Title
    this.OriginalName = obj.OriginalName
    this.Year = obj.Year
    this.Month = obj.Month
    this.Day = obj.Day
    this.Quality = obj.Quality
    this.Favourite = obj.Favourite
    this.Private = obj.Private
    this.Details = obj.Details
    this.CreatedAt = obj.CreatedAt
    this.CreatedAtDateTime = DateTime.fromJSDate(obj.CreatedAt)
    this.UpdatedAt = obj.UpdatedAt
    this.UpdatedAtDateTime = DateTime.fromJSDate(obj.UpdatedAt)
    this.DeletedAt = obj.DeletedAt
    this.DeletedAtDateTime = DateTime.fromJSDate(obj.DeletedAt)
  }
  TakenAt: Date;
  TakenAtDateTime: DateTime;
  TakenSrc: string;
  UID: string;
  Type: string;
  Title: string;
  OriginalName: string;
  Year: number;
  Month: number;
  Day: number;
  Quality: number;
  Favourite: boolean;
  Private: boolean;
  Details: sideCarFileDetails;
  CreatedAt: Date;
  CreatedAtDateTime: DateTime;
  UpdatedAt: Date;
  UpdatedAtDateTime: DateTime;
  DeletedAt: Date;
  DeletedAtDateTime: DateTime;
}
