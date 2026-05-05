```space-lua
function fixBulletIndent()
  local text = editor.getText()
  local lines = {}
  
  for line in string.gmatch(text .. "\n", "([^\r\n]*)\n") do
    local processed = line
    
    -- [핵심] 패턴 매칭 시 앞에 공백이 "더 있거나 덜 있지 않은" 정확한 상태를 체크해야 합니다.
    
    -- 1. 레벨 3 처리: 정확히 공백 4칸인 것만 찾아서 8칸으로 (이미 8칸인 건 패스)
    if string.match(processed, "^    %* ") then
        processed = string.gsub(processed, "^    %*", "        *")
        
    -- 2. 레벨 2 처리: 정확히 공백 2칸인 것만 찾아서 4칸으로 (이미 4칸인 건 패스)
    -- 패턴 설명: ^(시작) + 공백2개 + (세번째 칸은 공백이 아니어야 함: [^ ])
    elseif string.match(processed, "^  [^ ]") and string.match(processed, "^  %* ") then
        processed = string.gsub(processed, "^  %*", "    *")
    end
    
    table.insert(lines, processed)
  end
  
  local finalText = table.concat(lines, "\n")
  if text ~= finalText then
    editor.setText(finalText)
  end
end

command.define {
    name = "Custom: Fix Bullet Indent",
    run = fixBulletIndent
}
```