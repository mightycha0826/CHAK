/**
 * 사진 출처 — `scripts/fetch-photos.mjs`가 생성. 직접 고치지 말 것.
 *
 * 전부 위키미디어 공용의 자유 라이선스 저작물이다. 화면에 저작자와
 * 라이선스를 함께 노출하는 것이 CC BY / CC BY-SA의 조건이다.
 *
 * 마지막 수집: 2026-07-23
 */
export interface PhotoCredit {
  license: string
  author: string
  page: string
  /** 로딩 전 자리표시자 (20px 축소본) */
  blur?: string
}

export const PHOTO_CREDITS: Record<string, PhotoCredit> = {
  "bonjeon": {
    "license": "CC BY-SA 2.0",
    "author": "Joongi Kim",
    "page": "https://commons.wikimedia.org/wiki/File:%ED%98%84%EC%B6%A9%EC%82%AC(Hyeonchoong-sa)_01.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAPABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMFAv/EAB4QAAICAgIDAAAAAAAAAAAAAAECABEDBBIhExVR/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgED/8QAFhEBAQEAAAAAAAAAAAAAAAAAEQAB/9oADAMBAAIRAxEAPwBGN8iLxBNfJoM3ZdKlj1jM/JKAit/TfFrAmruHEoUo5TfUJUxaI8a8gCYTMyRt/9k="
  },
  "hyeonpan": {
    "license": "CC BY-SA 2.0",
    "author": "Joongi Kim",
    "page": "https://commons.wikimedia.org/wiki/File:%ED%98%84%EC%B6%A9%EC%82%AC(Hyeonchoong-sa)_02.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAPABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEAv/EACAQAAICAgEFAQAAAAAAAAAAAAECAAMEERQFEyFBQlH/xAAWAQEBAQAAAAAAAAAAAAAAAAACAAH/xAAYEQADAQEAAAAAAAAAAAAAAAAAARECUf/aAAwDAQACEQMRAD8A0mReo8MYwZ1zDQs2Y+3EbtMFA2RIcHpWRVeXdgVPrc0CrQ7mZI+zCV8P91CQbrh//9k="
  },
  "janggeom": {
    "license": "CC0",
    "author": "Suohros",
    "page": "https://commons.wikimedia.org/wiki/File:Yi_sun-sin_general_sword.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAPABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAQCAwX/xAAdEAABBAMBAQAAAAAAAAAAAAACAAEDBBESIRMi/8QAFwEAAwEAAAAAAAAAAAAAAAAAAQIDBP/EABcRAQEBAQAAAAAAAAAAAAAAAAAREiH/2gAMAwEAAhEDEQA/AJxQB5/T9S96uAQ7C6ZkqEI4cupaejK8T4PKyxfTF2whWlSkYnbZkJuBX//Z"
  },
  "nanjung": {
    "license": "Public domain",
    "author": "Korean Cultural heritage Administration",
    "page": "https://commons.wikimedia.org/wiki/File:%EC%9D%B4%EC%88%9C%EC%8B%A0_%EB%82%9C%EC%A4%91%EC%9D%BC%EA%B8%B0_%EB%B0%8F_%EC%84%9C%EA%B0%84%EC%B2%A9_%EC%9E%84%EC%A7%84%EC%9E%A5%EC%B4%88.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAPABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABAACBf/EAB4QAAMAAgEFAAAAAAAAAAAAAAABAgMEMRESEyFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAYEQEBAAMAAAAAAAAAAAAAAAAAEQECIv/aAAwDAQACEQMRAD8AFUVFtIZj1KvEqa5N3qd99UxkPx4lHwlN6XMct6/vgh7lNkUxQf/Z"
  },
  "gwan": {
    "license": "CC BY-SA 3.0",
    "author": "PHGCOM",
    "page": "https://commons.wikimedia.org/wiki/File:1795WoodblockPrintedBookOnYiSunSin.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAATABQDASIAAhEBAxEB/8QAGAABAAMBAAAAAAAAAAAAAAAAAAECAwT/xAAcEAACAwADAQAAAAAAAAAAAAAAAQIDERIhMUH/xAAXAQEAAwAAAAAAAAAAAAAAAAACAAED/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwDqrnyeYTbJx8RVQk57F4ibW8z6TF60pbcNYIpsUa8YASkm1Hozk3gBrQZJvPQACk//2Q=="
  },
  "gotaek": {
    "license": "CC BY 2.0",
    "author": "Jo from Brisbane, Australia",
    "page": "https://commons.wikimedia.org/wiki/File:Korea-Asan-Spring_garden_near_Hyeonchungsa-01.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAANABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFA//EAB4QAAIBBAMBAAAAAAAAAAAAAAECAAMEERITIjEU/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQAD/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAEREv/aAAwDAQACEQMRAD8AQtqqFclgJqloz1NmYaeyNTTsOxjfPUA1DnEwzAsRX+y2TrjyEhMuTkkwllDT/9k="
  },
  "bust": {
    "license": "KOGL Type 1",
    "author": "Unknown, War Memorial of Korea",
    "page": "https://commons.wikimedia.org/wiki/File:Bust_of_Yi_Sun-sin_01.jpg",
    "blur": "data:image/jpeg;base64,/9j/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAeABQDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUBAwYE/8QAHxAAAgICAgMBAAAAAAAAAAAAAQIAAwQFESETMVFB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAXEQEBAQEAAAAAAAAAAAAAAAAAAREh/9oADAMBAAIRAxEAPwDanoTnxsgWu689qZZkWeKln+CK9NeLrrG/SYacOIQhEFW8tuXGK1LyD7MV6oW02Kyd/RHuxPGM3XuKNWgrygSSeZFnVS8aJCSoJ9wkwlpf/9k="
  },
  "sugyeol": {
    "license": "Public domain",
    "author": "Yi Sun-sin",
    "page": "https://commons.wikimedia.org/wiki/File:SignatureYiSunSin.png"
  }
}

/** 사진 경로. 없으면 빈 문자열이 아니라 undefined를 돌려준다. */
export function photo(key: string): string | undefined {
  return PHOTO_CREDITS[key] ? `/photos/${key}.jpg` : undefined
}
