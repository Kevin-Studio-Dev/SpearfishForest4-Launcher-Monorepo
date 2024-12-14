#!/bin/bash

# 릴리즈 타입 선택
echo "릴리즈 타입을 선택하세요:"
echo "1) 정식 릴리즈"
echo "2) 사전 릴리즈"
read -p "선택 (엔터: 정식 릴리즈): " release_type

# 엔터 입력 시 정식 릴리즈 선택
if [ -z "$release_type" ]; then
    release_type="1"
fi

# 현재 브랜치 확인
current_branch=$(git rev-parse --abbrev-ref HEAD)

# 타임스탬프 생성 (하이픈 제거)
timestamp=$(date +%y%m%d%H%M%S)

# 브랜치 전환 로직
if [ "$release_type" = "1" ]; then
    if [ "$current_branch" != "master" ]; then
        echo "master 브랜치로 전환합니다..."
        git checkout master
    fi
    branch_prefix=""
else
    branch_timestamp=$(date +%y%m%d-%H%M%S)
    if [[ "$current_branch" == prerelease/* ]]; then
        echo "새로운 사전 릴리즈 브랜치로 전환합니다..."
        git checkout -b "prerelease/$branch_timestamp"
    else
        echo "새로운 사전 릴리즈 브랜치를 생성합니다..."
        git checkout -b "prerelease/$branch_timestamp"
    fi
    branch_prefix="beta."
fi

# 현재 버전 가져오기
current_version=$(node -p "require('./HeliosLauncher/package.json').version")
echo "현재 버전: v$current_version"

# 새 버전 입력받기
if [ "$release_type" = "1" ]; then
    read -p "새 버전을 입력하세요 (엔터: 패치 버전 자동 증가) (현재: $current_version): " version_number
    if [ -z "$version_number" ]; then
        # 현재 버전을 . 기준으로 분리
        IFS='.' read -r major minor patch <<< "$current_version"
        # 패치 버전 증가
        new_patch=$((patch + 1))
        new_version="$major.$minor.$new_patch"
    else
        new_version="$version_number"
    fi
else
    # 현재가 사전 릴리즈인지 확인
    if [[ "$current_version" == *-beta.* ]]; then
        # 사전 릴리즈에서 사전 릴리즈로 가는 경우
        # 기존 버전에서 타임스탬프만 변경
        base_version=$(echo "$current_version" | sed -E 's/-beta\.[0-9]+//g')
        new_version="$base_version-$branch_prefix$timestamp"
    else
        # 정식 릴리즈에서 사전 릴리즈로 가는 경우
        # 패치 버전을 증가시키고 타임스탬프 추가
        IFS='.' read -r major minor patch <<< "$current_version"
        new_patch=$((patch + 1))
        
        read -p "새 버전을 입력하세요 (엔터: $major.$minor.$new_patch) (현재: $current_version): " version_number
        if [ -z "$version_number" ]; then
            base_version="$major.$minor.$new_patch"
        else
            base_version="$version_number"
        fi
        new_version="$base_version-$branch_prefix$timestamp"
    fi
fi

# package.json 버전 업데이트
cd HeliosLauncher
npm version $new_version --no-git-tag-version

# 변경사항 커밋
cd ..
git add .
git commit -m "release: v$new_version"

# 브랜치 및 태그 푸시
current_branch=$(git rev-parse --abbrev-ref HEAD)
git push origin $current_branch

# 태그 처리
if [ "$release_type" = "1" ]; then
    # 정식 릴리즈: 버전 태그 생성
    git tag "v$new_version"
    git push origin "v$new_version"
    echo "정식 릴리즈 v$new_version이 성공적으로 배포되었습니다!"
else
    # 사전 릴리즈: prerelease 태그 업데이트
    git tag -f prerelease
    git push origin :refs/tags/prerelease || true
    git push origin prerelease
    echo "사전 릴리즈 v$new_version이 성공적으로 배포되었습니다!"
fi
