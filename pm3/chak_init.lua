--[[
  착(CHAK) 카드 발급 — 현충사

  빈 매직카드를 착 카드로 만든다. NDEF 포맷을 얹고, 지점 5개짜리
  빈 슬롯 골격을 써 넣는다.

  주의: 이미 한 번 발급한 카드를 다시 발급하려면 ndefformat이 공장 기본키를
  요구하므로 cwipe로 되돌려야 한다. Gen1a 매직카드라 백도어로 가능하다.

  ⚠️ 화면에 찍는 글자는 전부 ASCII다. PM3 윈도우 콘솔이 한글 UTF-8을 깨뜨려서
     (script list 출력의 경로가 깨지는 것과 같은 이유) 현장에서 읽을 수 없다.
     한글은 이렇게 주석에만 둔다.

  ⚠️ 긴 문자열을 등호 두 개짜리 구분자로 여는 이유: 대괄호를 겹쳐 여는 기본
     구분자는 안에 닫는 대괄호가 둘 붙어 나오면 거기서 끝나버린다. usage 문구에
     -h 같은 옵션을 대괄호로 감싸 쓰므로 반드시 등호를 끼워야 한다.
     같은 이유로 이 주석에도 닫는 대괄호를 붙여 쓰지 않는다.

  사용법:
    script run chak_init          (cwipe → ndefformat → 골격)
    script run chak_init -n       (cwipe 생략 — 새 카드일 때)
--]]

local getopt = require('getopt')
local ansicolors = require('ansicolors')

author = 'CHAK'
version = 'v1.0.0'
desc = [==[Issue a CHAK card - hcs (5 slots)]==]
usage = [==[script run chak_init [-h] [-n]]==]
arguments = [==[
    -h    this help
    -n    skip cwipe (factory-fresh card)
]==]

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

    print(ansicolors.cyan .. '[CHAK] issue card - stage hcs, 5 slots' .. ansicolors.reset)

    if not skipWipe then
        print('[CHAK] wipe (gen1a backdoor)')
        core.console('hf mf cwipe')
    end

    print('[CHAK] ndef format')
    core.console('hf mf ndefformat')

    print('[CHAK] write empty slots')
    for _, b in ipairs(BLOCKS) do
        core.console(('hf mf wrbl --blk %d -a -k %s -d %s'):format(b.blk, KEY, b.data))
    end

    print(ansicolors.green .. '[CHAK] done. verify with:  hf mf ndefread' .. ansicolors.reset)
end

main(args)
