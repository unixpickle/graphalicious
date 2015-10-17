jsbuild -license=LICENSE -name="graphalicious.base" -version=`cat VERSION` -output build_base.js -includeAPI src/base/*.js
jsbuild -license=LICENSE -name="graphalicious.ylcv" -version=`cat VERSION` -output build_ylcv.js -includeAPI src/y_label_content_view/*.js
cat build_base.js build_ylcv.js >build.js
rm build_base.js build_ylcv.js
