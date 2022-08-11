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

export interface SidecarFile {
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
    CreatedAt: DateTime;
    UpdatedAt: DateTime;
    DeletedAt: DateTime;
}
