jsbuild -license=LICENSE -name="graphalicious.base" -version=`cat VERSION` -output build_base.js -includeAPI src/base/*.js
jsbuild -license=LICENSE -name="graphalicious.ylcv" -version=`cat VERSION` -output build_ylcv.js -includeAPI src/ylcv/*.js
jsbuild -license=LICENSE -name="graphalicious.providers" -version=`cat VERSION` -output build_providers.js -includeAPI src/providers/*.js
jsbuild -license=LICENSE -name="graphalicious.styles" -version=`cat VERSION` -output build_styles.js -includeAPI src/styles/*.js

cat build_base.js build_styles.js build_ylcv.js build_providers.js >build.js
rm build_base.js build_ylcv.js build_providers.js build_styles.js
