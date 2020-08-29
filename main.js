function baseStrToZeroNumArr(baseStr) {
  const isOver19 = (char) => parseInt(char, 36) > 19;
  if (!isOver19(baseStr[baseStr.length - 1])) baseStr += "l";
  if (baseStr[0] == "k") baseStr = baseStr.slice(1);
  baseStr = baseStr.replace(/[m-z]/g, "l");

  /* kは実質区切り文字、l以降の文字はノーツ(1) ボーナス種別により文字が異なる
  /* 'kxxxl'でxxx個空白(0)が続くことを示す
  /* 'kl'は01を示す
  /* 'kxxxlyy'でxxx個0の後yy個1が続く */

  const tempArr = baseStr.split("k");
  if (tempArr[0].length == 0) tempArr.shift();
  const resArr = [];
  tempArr.forEach((str) => {
    const [zeros, ones] = str.split("l");
    const zerosNum = zeros.length == 0 ? 1 : parseInt(zeros, 20);
    resArr.push(zerosNum);
    if (ones && ones.length !== 0) {
      const onesNum = parseInt(ones, 20) - 1;
      resArr.push(new Array(onesNum).fill(0));
    }
  });
  return resArr.flat();
}

function convertZeroNumArr(zeroNumArr) {
  /* 9で割った時の商がノーツ位置、剰余がレーン
  /* zeroNumArrの合計値とノーツ数(要素数-1)の和が69120ならノーツ位置は96*80=7680箇所
  /* zeroNumArrの合計値とノーツ数(要素数-1)の和が23040ならノーツ位置は32*80=2560箇所 */

  const dataLength = zeroNumArr.reduce((acc, curr) => acc + curr) + zeroNumArr.length - 1;
  let blockSize;
  if (dataLength == 69120) blockSize = 96;
  else if (dataLength == 23040) blockSize = 32;
  else throw "Decoded data size is not right.";

  zeroNumArr.pop();
  const resArr = new Array(9).fill().map(() => []);
  let counter = 0;
  zeroNumArr.forEach((value) => {
    counter += value;
    const position = blockSize == 96 ? Math.floor(counter / 9) : Math.floor(counter / 9) * 3;
    const lane = counter % 9;
    resArr[lane].push(position);
    counter++;
  });

  // counter: 最後のノーツ位置 セーブデータ作成時に使用するため返す
  return [
    counter,
    resArr[3],
    resArr[0],
    resArr[1],
    resArr[2],
    resArr[4],
    resArr[6],
    resArr[7],
    resArr[8],
    resArr[5],
  ];
}

function convertedArrToSaveData(convertedArr) {
  const blockSize = 96;
  const maxNum = convertedArr.shift();
  const maxPageNum = Math.floor(Math.floor(maxNum / 9) / 96) + 1;
  const [keyKind, keyNum] = Math.max(convertedArr[0], convertedArr[8]) !== 0 ? ["9B", 9] : ["7", 7];
  if (keyNum === 7) convertedArr = convertedArr.slice(1, 8);

  const scores = new Array(maxPageNum).fill().map(() => ({
    speeds: [],
    notes: new Array(keyNum).fill().map(() => []),
    freezes: new Array(keyNum).fill().map(() => []),
  }));

  convertedArr.forEach((laneArr, lane) => {
    laneArr.forEach((position) => {
      const page = Math.floor(position / blockSize);
      const pos = (position % blockSize) * 4;
      scores[page].notes[lane].push(pos);
    });
  });

  const obj = {
    blankFrame: 200,
    timings: [
      {
        label: 1,
        startNum: 0,
        bpm: 140,
      },
    ],
    scoreNumber: 1,
    scores,
    keyKind,
  };

  return JSON.stringify(obj);
}

const makeSaveData = (baseStr) => {
  try {
    const zeroNumArr = baseStrToZeroNumArr(baseStr);
    const convertedArr = convertZeroNumArr(zeroNumArr);
    const saveData = convertedArrToSaveData(convertedArr);
    return saveData;
  } catch {
    return "変換できませんでした。"
  }
};

// const baseStr =
  // "k3l2k3lkilk4lk13lk1clk11lkl2k28lk6lk13lklk12lk1alk2dlk12lk2lk12lk15lk15lk19lk4lk13l2k14lk14lk5lkilk2lklk29lk6lk13l2k13lk19lk2dlk12l2k1alk15lk10lk19lk3l2k13l2k14lk14lk5lkjlklklk28lk7lk10lk2lk14lk17lk2flk11lklk17lk2glk11l2k4lk13lk13lk1clk10l2klk2glk13lklk12l2klk12lk2blk19l2k2lk10lk1clk10lk15lk6lk11lk2lk28lk6lk11lkl2k28lk6lk11lk2lk12lk4lklk28lk3lk27lk2lk3lk11lk2lk3elk6lk11lk2lk28lk6lk11lkl2k28lk6lk11lk2lk12lk4lklk25lk6lk29l2k3lkjlk3lk3flk6lk11lk2lk28lk6lk11lkl2k28lk6lk11lk2lk14lk2lk10lk4lklk28lk3lk10lk3lk3lk26lklk2lk29lk4lk10lk3lk11lk19lk3lk13l2k13lk15lk5lkjlk4lk17lklk12lk14lk15lk15lk4lk13lk5lkilk6lk11lk3lk11lk2l2klk29lk4lkilklkl3k3flk2l2k2lk2clk12lk2lk10lklklk3lk14lk11lkl3klk28lklklk27lk2l3k2lk10lk1al2k11lk15lk2l2k2glk14lk10lk2lk15lk1al2k11lk15lk2l2k2elk10lk1blk2lk14lk11l2k1alk13l2k2lk26lk18lk19lk2lk14lk11l2k1alk13l2k2lk15lk12lk15lk15lk2lk15lk1al2k11lk15lk2l2k2glk14lk10lk2lk15lk1al2k11lk15lk2l2k11lk1clk2clk2lk14lk11l2k1alk13l2k2lk26lk18lk19lk2lkilk5lk11l2k1alk13l2k2lk28lk5lk26lklk3lkjlk1clklkilk18lkl2k2glk15lk10lklk13lk1clklkilk18lkl2k2blk2lk2clklk17lkilklk1clk11l2klk27lk17lk1alklk17lkilklk1clk11l2klk17lk11lk19lk12lklk13lk1clklkilk18lkl2k2flk15lk11lklk13lk1clklkilk18lkl2k18lk10lk18lk13lklk3lklk50lkl3klk50lkl3kl2k3dl3k3l3k3dl2kl3klk28lk2hlk28l2k4lk2clk15lk13lk19lk17lk28l2klk2elklk25lk6lk28lk4lk26lk6lk2blk19lkil2k4lk18lk13lk28lklk4lk51lk3lk2lk2blk28l2k2elk1alk10lk4lk17lk12lk2blk3l2k2flk25lklklklk28lk5lk28lklklklk26lk5lk11l5k3elk7lk15lk10lk6lk15lk11lk5lk15lk12l3k28lk5lk29lklk2glk10lk18lk4lkjlk1clk28lkl2k29lk2clk4l2k29lk5lk29lk2glk10lk15lk5lk14lk1alk28l2k2lk51lk3lk2lk25lk5lk2blklk2clk13lk15lk17lk19lk28lk3lk2lk2elk27l3klk51l2k2lk2lk52lkl3k52lk2lk2l2k51l5k42lkilk3lk2lk3flk5lkjlk1bl2k12lk2alk3l2k54lk3lklk26lk2dlk2lk2clk3lk14lk17lk14lk18lk27lklklk2alk5lk29lkl2k28lk2fl3k2el2k11lk14lk18lk1alk2blk3lk25lk6lk28l2k2lklk3dlk5lk13lk29lk7lk12lk13l2k2lklk12lk2lk3elk7lk10lk17lk2lk12lk15lk2l2k52lk3lklk3glk2lk19lk14lk11lk18lk13lk3l2k2alk4lk29lk2lk28lk1clkjlk3l2k2elk11l2k1clk12lk2lkjlk19lk14lk4lklk25lklk2clk3lklk2clk2al2k2alk1blk12lk2lk2lk25lk2hlk2lk27lk2el2k2lk3elk7lk12lk2blk2l2k28lklk4lk14lk14lk14lk14lk5l2k52l2kl2k27lk2hlk3lk25lk2glk2glk2blk3lk2blk17lkjlklkl2k3glk5l2k3el2k2lk27lk3l2klk15lk12lk15lk1blklkilk1elkilk19l3k29lk2elk5lk25l2k2flklklk27lk1blk12lk1alk11lk2clk4l2k2blk15lk3lk11lk2blk7lk26lk3lklk13lk15lk2elk3lk13lk11lk2fl3klk2elk27lk5lk2clk12lk14lk3l2k2lk10lk1alk28lk5lk28lk3lk27lk2l2k2lk51lk2lklklk51l4k19lk14lk27l2k2lk2lk15lk12lk1alk10lk2el2k2lk2lk28lk2glk10lk18lk4lkjlk1clk2alk4lk25lk4lk2al2k2l2k3elk3lk15lk29lklk4lk29lkl2k14lk14lk14lk17lk5lk26lk18lk18l3klk51l2k2blk1clkjlk3l3k53lk5lk2clk10lk17lkl3k3flk6lk12lk2bl2k3lk26lk3lk3lk3clk3lk3lk3clk3lk3lk3dl2k3lk3elk6lk29lk4lk25lklk2l2kaclk13lk17lk17lk17l2k14lk3lk13lk3lk11lk5lk11m3k11lk1clk28lk3lk2lk2blk12lk17lk3lk11lk1alk27lk3l2k17lk12lk17lk14lk5l2k27lk14lk5lk13lk2clk5lk26lk3lklk13lk18lk12lk18lk3lk28lk13lk17lk3l2k28lk3lk29lk3l2k29lk5lk15lkjlk2glkl2k29lk5lk25lk6lk27lk2l2k55l2k2lk50lk3lk3lk10lk19lk29lk2lk2lk12lk18lk28lklk3lk27lk5lk27lklk3lk2clk18lk10lklk1alk14lk2alklk3lk28lk2lk28lk3lk2lk27lk1al2kjlk18lk17lk4lk25lk4lklk13lk14lk17lk19lklk27lk15lk15lk4lklk28l2k2lk27lk4lklk2clk12lk17lk15lk18lk2alk5lk26lk3lk3lk27l2kl2k28lk2glk3lk25lk2hlk2lk15lk12lk15lk19lk3lkilk1elkilk18l2kl2k28lk6lk25lk5lk17lk11lk5lkilk19lk2lk10lk18lk5lk29lklk17lk10lk6lk25lk4l2k29lk1bl2kilk17lk17lk3lk27lk4lklk13lk14lk1alk10lk3lk13lk17lk4lkjlk17lk4lk28lk3lk29lk4lk18lk11lklk13lk14lk6lk11lk17lk4lk25lk3l2k19lkjlk5lk28lk3lk10lk1dlk12lk17lklk11lk1dlkilk1bl2k12lk1blk10lk15lk3lk14lk1alk18lk11l3klk50lklklk3lk3dlkl2klk3fl2kl2k2bl2kl2k53l3k2lk4jl2k2lklk3gl3k2lk3fl3klk27lk3l2klk52l2k2lklk2clk26l2k2lk2flk12lk5lk14lk12lk17lklk29lk2lk3lk25lk6lk27l2klklk2alk18lk2lk28lk14lk3lklk11lk18lk14lk2lk11lk1clk11lk5l2k10lk17l2klk51lklklk2lk27lk2l3k29l2k3l2kjlk2l3k3elk7lk11l3k13lk3lk10l2k2lk2l2k27lklklk27lk2l3k2lk14lk11l2k1alk13l2k2lk17lk10lk15lk1alk2lk14lk11l2k1alk13l2k2lk14lk13lk15lk15lk2lk15lk1al2k11lk15lk2l2k17lk17lk17lkilk2lk15lk1al2k11lk15lk2l2k17lk10lk19lk18lk2lk14lk11l2k1alk13l2k2lkjlk18lk1alk15lk2lk14lk11l2k1alk13l2k2lk11lk1alk17lkjlk2lk15lk1al2k11lk15lk2l2k17lk12lk1clkilk2lk15lk1al2k11lk15lk2l2k14lk13lk7lk2alklk17lkilklk1clk11l2klk11lk17lk1alk15lklk17lkilklk1clk11l2klk15lk18lk11lk15lklk13lk1clklkilk18lkl2k14lk19lk17lk10lklk13lk1clklkilk18lkl2k12lk15lk19lk18lklk17lkilklk1clk11l2klk17lk10lk1blk15lklk17lkilklk1clk11l2klk15lk18lk10lk15lklk3lklk50lkl3klk50lklkl3klk3cl2kl2klklk3el6k4hff";
// const tmp = baseStrToZeroNumArr(baseStr)
// console.log(tmp.length)
// console.log(tmp.reduce((acc, curr) => acc + curr))
// const tmp2 = convertZeroNumArr(tmp)
// console.log(tmp2[0],tmp2.map(arr => arr.length))
// console.log(tmp2)
// const save = makeSaveData(baseStr);
// console.log(save);
