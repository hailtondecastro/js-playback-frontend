# json-playback-recorder-ts
Framework for integrate entity object graph operations (field, collections modifications, etc) between backend and frontend.

### Source control, developer and build/ci environment.

#### Github commits (developer environment)
  [See](https://github.com/hailtondecastro/json-playback-player-hibernate#github-commits-developer-environment)
  
#### Npm registry (www.npmjs.com)
  Create an [Access Token](https://www.npmjs.com/settings/hailtondecastro/tokens)
  
#### travis-ci.com
  On [hailtondecastro/json-playback-recorder-ts - Travis CI settings](https://travis-ci.com/hailtondecastro/json-playback-recorder-ts/settings):
  1. Secret variables (DISPLAY VALUE IN BUILD LOG "off" and remember escape special character):
      - GPG_PASSPHRASE: same of GPG_PASSPHRASE defined on [travis.gpg](https://github.com/hailtondecastro/json-playback-player-hibernate#travis-cicom);
      - NPM_PUBLISH_TOKEN: npm Access Token;