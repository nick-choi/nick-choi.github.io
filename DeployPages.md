```space-lua
function convertWikiLinks(text)
  -- [[Page]] → [Page](Page.md)
  text = string.gsub(text, "%[%[([^%]]+)%]%]", function(link)
    return "[" .. link .. "](" .. link .. ".md)"
  end)

  return text
end

function runDeploy()
    -- 0 clean up old dist files
    local oldDistFiles = query[[
        from p = index.tag "page"
        where p.name:startsWith("dist/")
        select p.name
    ]]
  
    for _, oldFile in ipairs(oldDistFiles) do
        space.deletePage(oldFile)
    end
  
    -- 1. 배포 대상 선정 (Library 제외, private 제외)
    local publicPages = query[[
        from p = index.tag "page"
        where not table.includes(p.tags, "private")
          and not p.name:startsWith("Library/")
          and not p.name:startsWith("dist/")    
          and not p.name:startsWith("CONFIG")
          and not p.name:startsWith("SETTINGS")
          and not p.name:startsWith("_")    
        select p.name
    ]]
    
    print("--- 배포 프로세스 시작 ---")
    local count = 0
    
    for _, name in ipairs(publicPages) do
        -- 2. 본문 읽기
        local content = space.readPage(name)
        local newContent = convertWikiLinks(content)
  
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