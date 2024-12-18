#!/bin/bash
find . -name "RCTDevMenu.mm" -exec sed -i '' 's/localhost:8081/localhost:8082/g' {} \;
find . -name "RCTBundleURLProvider.mm" -exec sed -i '' 's/localhost:8081/localhost:8082/g' {} \;
