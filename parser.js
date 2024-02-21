function parseLine(line, newPoints, newFaces) {
    const id = line.split(" ")[0];
    if(id == 'v') {
        let splits = line.split(" ");
        let [_, x, y, z] = splits;
        newPoints.push([Number(x), Number(y), Number(z)]);
    }
    else if(id == 'f') {
        let splits = line.split(" ");
        let [_, a, b, c] = splits;
        a = a.split("/")[0];
        b = b.split("/")[0];
        c = c.split("/")[0];
        newFaces.push([Number(a), Number(b), Number(c)]);
    }
}

document.getElementById('file').onchange = function() {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function(progressEvent) {
    let newPoints = [];
    let newFaces = [];
    const text = this.result;
    let lines = text.split('\n');
    for (var line = 0; line < lines.length; line++) {
      parseLine(lines[line], newPoints, newFaces);
    }

    points = newPoints;
    faces = newFaces;
    console.log("points:");
    console.log(newPoints);
    console.log("faces:");
    console.log(newFaces);
  };
  reader.readAsText(file);
};