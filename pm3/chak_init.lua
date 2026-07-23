--[[
  착(CHAK) 카드 발급 — 현충사

  빈 매직카드를 착 카드로 만든다. NDEF 포맷을 얹고, 지점 5개짜리
  빈 슬롯 골격을 써 넣는다.

  주의: 이미 한 번 발급한 카드를 다시 발급하려면 ndefformat이 공장 기본키를
  요구하므로 cwipe로 되돌려야 한다. Gen1a 매직카드라 백도어로 가능하다.

  사용법:
    script run chak_init          (cwipe → ndefformat → 골격)
    script run chak_init -n       (cwipe 생략 — 새 카드일 때)
--]]

local getopt = require('getopt')
local ansicolors = require('ansicolors')

author = 'CHAK'
version = 'v1.0.0'
desc = [[착 카드 발급 — 현충사 (지점 5개)]]
usage = [[script run chak_init [-h] [-n]]]
arguments = [[
    -h    이 도움말
    -n    cwipe 생략 (공장 출하 상태의 새 카드일 때)
]]

local KEY = 'D3F7D3F7D3F7'

local BLOCKS = {
    { blk = 4, data = '035ED1015A5402656E4348414B313A3A' },
    { blk = 5, data = '2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E' },
    { blk = 6, data = '2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E' },
    { blk = 8, data = '2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E' },
    { blk = 9, data = '2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E' },
    { blk = 10, data = '2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E' },
    { blk = 12, data = 'FE000000000000000000000000000000' },
}

local function help()
    print(desc); print(ansicolors.cyan .. usage .. ansicolors.reset); print(arguments)
end

local function main(args)
    local skipWipe = false
    for o in getopt.getopt(args, 'hn') do
        if o == 'h' then return help() end
        if o == 'n' then skipWipe = true end
    end

    print(ansicolors.cyan .. '[착] 카드 발급 — 현충사' .. ansicolors.reset)

    if not skipWipe then
        print('[착] Gen1a 백도어로 초기화')
        core.console('hf mf cwipe')
    end

    print('[착] NDEF 포맷')
    core.console('hf mf ndefformat')

    print('[착] 빈 슬롯 골격 쓰기')
    for _, b in ipairs(BLOCKS) do
        core.console(('hf mf wrbl --blk %d -a -k %s -d %s'):format(b.blk, KEY, b.data))
    end

    print(ansicolors.green .. '[착] 발급 완료. 확인: hf mf ndefread' .. ansicolors.reset)
end

main(args)
