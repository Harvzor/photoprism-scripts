import { DateTime, Zone } from "luxon"

import { sideCarFileDetails } from "./sideCarFileDetails"

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
    TakenAt: Date | undefined;
    TakenSrc: string | undefined;
    UID: string | undefined;
    Type: string | undefined;
    Title: string | undefined;
    OriginalName: string | undefined;
    Year: number | undefined;
    Month: number | undefined;
    Day: number | undefined;
    Quality: number | undefined;
    Favourite: boolean | undefined;
    Private: boolean | undefined;
    Details: sideCarFileDetails | undefined;
    CreatedAt: Date | undefined;
    UpdatedAt: Date | undefined;
    DeletedAt: Date | undefined;
}

export class SidecarFile implements SidecarFileRaw {
    constructor(obj: SidecarFileRaw) {
        // Only likely to be true if the file is empty.
        if (obj == undefined) {
            return
        }

        this.TakenAt = obj.TakenAt
        this.TakenAtDateTime = obj.TakenAt ? this.fromJSDateUTC(obj.TakenAt) : undefined
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
        this.CreatedAtDateTime = obj.CreatedAt ? this.fromJSDateUTC(obj.CreatedAt) : undefined
        this.UpdatedAt = obj.UpdatedAt
        this.UpdatedAtDateTime = obj.UpdatedAt ? this.fromJSDateUTC(obj.UpdatedAt) : undefined
        this.DeletedAt = obj.DeletedAt
        this.DeletedAtDateTime = obj.DeletedAt ? this.fromJSDateUTC(obj.DeletedAt) : undefined
    }
    // If the date stored in the YAML is 2015-11-20T05:20:30Z, the property will be put into local timezone in the default parameter.
    // So probably I need to convert it back?
    // TODO: Test with an image that wasn't taken in UTC timezone?
    private fromJSDateUTC(jsDate: Date) {
        return DateTime.fromJSDate(jsDate, { zone: 'UTC' })
    }
    TakenAt: Date | undefined;
    /**
     * Even if the taken datetime is technically unknown, this value will be equal to the index/import time.
     */
    TakenAtDateTime: DateTime | undefined;
    TakenSrc: string | undefined;
    UID: string | undefined;
    Type: string | undefined;
    Title: string | undefined;
    OriginalName: string | undefined;
    /**
     * Could be -1 if unknown.
     */
    Year: number | undefined;
    /**
     * Could be -1 if unknown.
     */
    Month: number | undefined;
    /**
     * Could be -1 if unknown.
     */
    Day: number | undefined;
    Quality: number | undefined;
    Favourite: boolean | undefined;
    Private: boolean | undefined;
    Details: sideCarFileDetails | undefined;
    CreatedAt: Date | undefined;
    CreatedAtDateTime: DateTime | undefined;
    UpdatedAt: Date | undefined;
    UpdatedAtDateTime: DateTime | undefined;
    DeletedAt: Date | undefined;
    DeletedAtDateTime: DateTime | undefined;
}
