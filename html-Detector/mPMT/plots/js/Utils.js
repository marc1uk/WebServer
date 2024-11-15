const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function medianFilter(arr, windowSize) {
  filteredArr = [];
  // make arr zero-padding
  zeroPadding = new Array(Math.floor(windowSize/2)).fill(0);

  arrZeroPadding = zeroPadding.concat(arr, zeroPadding);
  //iterate throug arr to calculate the new values
  let index = 0;
  for(let i = Math.floor(windowSize/2); i < arrZeroPadding.length -  Math.floor(windowSize/2); i++) {
      filteredArr[index] =  median(arrZeroPadding.slice(i - Math.floor(windowSize/2), i + Math.floor(windowSize/2) + 1));
      index++;
  }
  return filteredArr;
}

function enqueueFIFOArrayElements(fifoArr, newArr) {
// Remove newArr.length first elements from fifoArr
// console.log("enqueue 1: ", fifoArr)
// console.log("enqueue 2: ", newArr)
fifoArr.splice(0, newArr.length);
// Add newArr to the end of fifoArr
fifoArr = fifoArr.concat(newArr);
// console.log("enqueue 3: ", fifoArr)
return fifoArr;
}
