# Photoprism Scripts

## Versions

- Node v18.7.0
- TypeScript 4.7.4

## FAQs

- Can I reorganise photos in the filesystem from Photoprism? https://github.com/photoprism/photoprism/discussions/1942
    - > No

## Aims

- move private pictures into private folder
- move archived pictures into archived folder
    - so I can backup before deleting archived pictures
- organise photos into year/month folders
    - Photoprism seems to do this on first import, but if the date is wrong, and I update it, it won't be moved
        - need to test this assumption
- allow organising photos into albums too
    - issue being that a photo can belong to multiple albums, so somehow the file needs to exist in multiple places
        - can symlinks solve this issue? or does that break Photoprism?
- save metadata to photos
    - Photoprism seems to only update YAML files when metadata is updated, this data should be copied to the pictures too
        - check this assumption
- write script to compress photos
    - I copy the compressed images to my phone

## Todo

- search API instead of searching filesystem
    - search API for albums https://pkg.go.dev/github.com/photoprism/photoprism/internal/api?utm_source=godoc#SearchAlbums
    - search API for photos `/api/v1/photos?archive=true`
        - returns array with property `FileName` which describes location of file, so this could be checked to see if it's correct
