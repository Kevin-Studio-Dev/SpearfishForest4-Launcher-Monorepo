#!/bin/bash

# 현재 버전 가져오기
current_version=$(node -p "require('./HeliosLauncher/package.json').version")
echo "현재 버전: v$current_version"

# 새 버전 입력받기
read -p "새 버전을 입력하세요 (예: 1.0.0): " new_version

# package.json 버전 업데이트
cd HeliosLauncher
npm version $new_version --no-git-tag-version

# 변경사항 커밋
cd ..
git add .
git commit -m "release: v$new_version"

# 태그 생성 및 푸시
git tag "v$new_version"
git push origin main
git push origin "v$new_version"

echo "v$new_version 버전이 성공적으로 배포되었습니다!"
