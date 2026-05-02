```space-lua
-- slugify: 파일명 안전하게 변환
function slugify(name)
  local s = string.lower(name)
  s = string.gsub(s, "%s+", "-")        -- 공백 → -
  s = string.gsub(s, "[^%w%-/]", "")    -- 특수문자 제거 (/, - 제외)
  return s
end

function fixNestedListIndentation(text)
  local lines = {}
  
  -- 텍스트를 한 줄씩 순회합니다.
  for line in string.gmatch(text .. "\n", "([^\r\n]*)\n") do
    -- 줄의 시작이 정확히 공백 2개와 별표(  *)인 패턴을 감지
    -- 패턴 설명: ^(줄 시작) %s%s(공백 2개) %*%s+(별표와 그 뒤 공백들)
    local match = string.match(line, "^  %*%s+(.+)")
    
    if match then
      -- 공백 4개 + 별표 형태로 변환하여 삽입
      table.insert(lines, "    * " .. match)
    else
      -- 그 외의 일반 줄이나 상위 목록은 그대로 유지
      table.insert(lines, line)
    end
  end
  
  return table.concat(lines, "\n")
end

-- [Page|Alias](Page|Alias.md) 처리
function convertAliasLinks(text)
  text = string.gsub(text, "%[%[([^%]|]+)|([^%]]+)%]%]", function(target, alias)
    local link = slugify(target)
    return "[" .. alias .. "](" .. link .. ".md)"
  end)
  return text
end

-- [Page](Page.md) 처리
function convertWikiLinks(text)
  -- [Page](Page.md) → [Page](Page.md)
  text = string.gsub(text, "%[%[([^%]]+)%]%]", function(link)
    return "[" .. link .. "](" .. link .. ".md)"
  end)

  return text
end

-- URL을 찾아 마크다운 링크 [URL](URL)로 변환하는 함수
function linkify(text)
  -- 이미 마크다운 링크 안에 있거나, 이미지 링크인 경우를 제외하고
  -- http/https로 시작하는 URL만 찾아 치환합니다.
  -- 패턴: (공백 또는 줄바꿈)(http...)
  local urlPattern = "([^%[%(!])(https?://[%w-_%.%?%/%+=&#%%]+)"
  
  -- URL을 [URL](URL) 형태로 변경
  local linkedText = text:gsub(urlPattern, "%1[%2](%2)")
  
  return linkedText
end

--  제거 (원하면 주석 처리)
function cleanup(text)
  text = string.gsub(text, "#%w+", "")

  -- 불필요한 공백 정리
  text = string.gsub(text, "\n%s*\n%s*\n+", "\n\n")

  return text
end

function runDeploy()
    -- 0 clean up old dist files
    local oldDistFiles = query[
        from p = index.tag "page"
        where p.name:startsWith("dist/")
        select p.name
    ](
        from p = index.tag "page"
        where p.name:startsWith("dist/")
        select p.name
    .md)
  
    for _, oldFile in ipairs(oldDistFiles) do
        space.deletePage(oldFile)
    end
  
    -- 1. 배포 대상 선정 (Library 제외, private 제외)
    local publicPages = query[
        from p = index.tag "page"
        where not table.includes(p.tags, "private")
          and not p.name:startsWith("Library/")
          and not p.name:startsWith("dist/")    
          and not p.name:startsWith("CONFIG")
          and not p.name:startsWith("SETTINGS")
          and not p.name:startsWith("_")    
        select p.name
    ](
        from p = index.tag "page"
        where not table.includes(p.tags, "private")
          and not p.name:startsWith("Library/")
          and not p.name:startsWith("dist/")    
          and not p.name:startsWith("CONFIG")
          and not p.name:startsWith("SETTINGS")
          and not p.name:startsWith("_")    
        select p.name
    .md)
    
    print("--- 배포 프로세스 시작 ---")
    local count = 0
    
    for _, name in ipairs(publicPages) do
        -- 2. 본문 읽기
        local content = space.readPage(name)
        local newContent = convertAliasLinks(content)
        newContent = fixNestedListIndentation(content)
        newContent = linkify(newContent)
        newContent = convertWikiLinks(newContent)
        newContent = cleanup(newContent)
  
        if newContent then
            -- 3. 배포용 경로 설정 (예: 'dist/파일명')
            -- 실버불렛 내부에 'dist'라는 가상 폴더를 만들어 결과물을 모읍니다.
            local deployPath = "dist/" .. name
            
            -- 4. 파일 쓰기 (기존 내용 덮어쓰기)
            space.writePage(deployPath, newContent)
            
            print("복사 완료: " .. name .. " -> " .. deployPath)
            count = count + 1
        end
    end
    
    editor.flashNotification(count .. "개의 파일이 dist/ 폴더로 복사되었습니다.", "info")
end

command.define {
    name = "Custom: Deploy to Dist",
    run = runDeploy
}
```