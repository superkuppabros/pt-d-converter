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
