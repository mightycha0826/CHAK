--[[
  착(CHAK) 현장 리더 — 현충사

  지점에 두고 돌려놓는 스크립트. 착 카드가 올라오면 그 지점 슬롯에
  「방문했음 + 시각」을 찍는다.

  ── 왜 카드를 읽지 않는가

  슬롯이 MIFARE 블록 경계에 정확히 맞춰져 있어서, 각 지점은 자기 블록
  하나만 덮어쓰면 된다. 읽고→해석하고→덧붙여 다시 쓰는 방식이었다면
  현장 리더가 실패할 수 있는 지점이 세 배로 늘어난다.

  시각은 이 PC의 로컬 시각을 쓴다. 리더 PC 시계가 틀어져 있으면 그대로
  카드에 박히므로 설치 전에 한 번 맞출 것.

  사용법:
    script run chak_stamp -s nanjung      키오스크 모드 (엔터로 종료)
    script run chak_stamp -s nanjung -1   한 장만 찍고 종료
    script run chak_stamp -l              지점 목록
--]]

local getopt = require('getopt')
local ansicolors = require('ansicolors')
local lib14a = require('read14a')

author = 'CHAK'
version = 'v1.0.0'
desc = [[착 현장 리더 — 현충사]]
usage = [[script run chak_stamp [-h] [-l] [-1] -s <지점id>]]
arguments = [[
    -h            이 도움말
    -l            지점 목록 출력
    -s <지점id>   이 리더가 담당할 지점
    -1            한 장만 찍고 종료 (기본은 계속 대기)
]]

local KEY = 'D3F7D3F7D3F7'

local SPOTS = {
    { id = 'gwan', code = 'GWAN', blk = 5, title = '충무공이순신기념관' },
    { id = 'nanjung', code = 'NANJ', blk = 6, title = '난중일기' },
    { id = 'janggeom', code = 'JANG', blk = 8, title = '이순신 장검' },
    { id = 'gotaek', code = 'GOTA', blk = 9, title = '이충무공 고택과 활터' },
    { id = 'bonjeon', code = 'BONJ', blk = 10, title = '본전' },
}

local function help()
    print(desc); print(ansicolors.cyan .. usage .. ansicolors.reset); print(arguments)
end

local function listSpots()
    print(ansicolors.cyan .. '[착] 현충사 지점' .. ansicolors.reset)
    for _, s in ipairs(SPOTS) do
        print(('  %-10s %s  (슬롯 블록 %d)'):format(s.id, s.title, s.blk))
    end
end

local function findSpot(id)
    for _, s in ipairs(SPOTS) do
        if s.id == id then return s end
    end
    return nil
end

--- ASCII 문자열 → PM3 -d 인자로 쓸 16진수
local function tohex(s)
    return (s:gsub('.', function(c) return string.format('%02X', c:byte()) end))
end

--- 지점 슬롯 한 블록을 통째로 덮어쓴다. 명령 한 줄이면 끝난다.
local function stamp(spot)
    local slot = spot.code .. os.date('%y%m%d%H%M%S')
    core.console(('hf mf wrbl --blk %d -a -k %s -d %s'):format(spot.blk, KEY, tohex(slot)))
    return slot
end

local function main(args)
    local spotId, once = nil, false
    for o, a in getopt.getopt(args, 'hls:1') do
        if o == 'h' then return help() end
        if o == 'l' then return listSpots() end
        if o == 's' then spotId = a end
        if o == '1' then once = true end
    end

    if not spotId then
        print(ansicolors.red .. '[착] -s 로 지점을 지정하세요.' .. ansicolors.reset)
        return listSpots()
    end

    local spot = findSpot(spotId)
    if not spot then
        print(ansicolors.red .. ('[착] 모르는 지점: %s'):format(spotId) .. ansicolors.reset)
        return listSpots()
    end

    print(ansicolors.cyan .. ('[착] %s · %s'):format('현충사', spot.title) .. ansicolors.reset)
    print(('[착] 슬롯 블록 %d · 착을 대주세요%s'):format(
        spot.blk, once and '' or ' (엔터로 종료)'))

    local stamped = 0
    repeat
        local card = lib14a.read(false, true)
        if card then
            local slot = stamp(spot)
            stamped = stamped + 1
            print(ansicolors.green ..
                ('[착] %s  UID %s  → %s'):format(spot.title, card.uid, slot) ..
                ansicolors.reset)

            -- 카드를 떼기 전까지 기다린다. 안 그러면 한 번 댄 걸로 계속 찍힌다.
            while lib14a.read(false, false) do
                if core.kbd_enter_pressed() then break end
            end
        end
        core.clearCommandBuffer()
    until once or core.kbd_enter_pressed()

    print(ansicolors.cyan .. ('[착] 종료 — %d장 처리'):format(stamped) .. ansicolors.reset)
end

main(args)
