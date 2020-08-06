/******************************
 * Scaling seat map for the
 * Neptune Theatre, Seattle
 * JavaScript by Jeff Beauvoir
 *
 * Color palette for this app:
 * Light Gray BG: #d3d3d3
 * Gray Control Panel: #808080
 * Lighter Gray Icon Click: #909090
 * Dark Gray Row Labels: #424242
 * Black: #000, White: #fff
 * PL1 Baby Blue: #7AC5CD
 * PL2 Yellow: #FFFF00
 * PL3 Orange: #FF9912
 * PL4 Purple: #E600D6
 * PL5 Mint Green: #73F973
 * PL6 Red: #FF0000
 * Select Border Brown: #8B4513
 ******************************/


var activeSquare = false;
var dragPanel = false;
var undoSnapshotNeeded = false;
var addPanelIcon = false;
var canRedo = false;
var canUndo = false;
var redoing = false;
var selectX;
var selectY;
var selectWidth;
var selectHeight;
var qtySelected = 0;
var currentPriceLevel = 'none';
var panelX = 517;
var panelY = 15;
var deltaX = 0;
var deltaY = 0;
var inStanding = false;
var standingColor = '#fff';
var standingPreviousColor = '#fff';
var standingUndoColor = '#fff';
var standingClick = false;
var inTheMap = false;
var interval;

// Define each starting price and dummy variables for later print/calculation:
var pricePL1 = 75;
var pricePL2 = 60;
var pricePL3 = 50;
var pricePL4 = 40;
var pricePL5 = 30;
var pricePL6 = 20;
var priceToPrint = 0;
var revenueToPrint = 0;
var revenueCume = 0;

// Starting quantities at each price:
var qtyPL1 = 0;
var qtyPL2 = 0;
var qtyPL3 = 0;
var qtyPL4 = 0;
var qtyPL5 = 0;
var qtyPL6 = 0;
var qtyAssigned = 0;
var qtyNone = 766;

//Absolute positions of selection square, whether selectX is top-left or bottom-right:
var edgeLeft = 0;
var edgeRight = 0;
var edgeTop = 0;
var edgeBottom = 0;

// Reset the edges when needed:
function resetEdge() {
    edgeLeft = 0;
    edgeRight = 0;
    edgeTop = 0;
    edgeBottom = 0;
}

var rows = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','R','S','TR1'];


// Create multidimensional array with starting coordinates of seat map and status
// Elements are: [0]x-coord, [1]y-coord, [2]current price assignment, [3]previous price assignment, [4]whether currently selected, and [5]price assignment snapshot for "undo" function.
var seatMapArray = new Array;

// Take coordinates and loop through quantity, adding 12px each time, to make a full row:
// If backward is true, move right-to-left
function makeARow(crd1, crd2, qtySeats, backward) {

    for (i=0; i<qtySeats; i++) {
        seatMapArray.push([crd1, crd2, 'none', 'none', false, 'none']);
        if (backward==true) {crd1 -= 12;} else {crd1 += 12;}
    }

}

// Make a block of rows if the seat qty is the same, adding 12px to each row:
// AddSeat is how many seats to add with each new row
// If backward is true, move right-to-left
function makeABlock(crd1, crd2, qtySeats, qtyRows, addSeat, backward) {

    // Create new variable for seat qty in case we need to add to it:
    var quantity = qtySeats;

    for (a=0; a<qtyRows; a++) {
        makeARow(crd1, crd2, quantity, backward);
        if (typeof addSeat == 'number') {quantity += addSeat;}
        crd2 += 12;
    }

}

// Now make the seat map by building coordinates into the array:

makeABlock(216,32,9,4,1,true); // MAINL A-D
makeABlock(216,80,13,4,0,true); // MAINL E-H

makeABlock(216,152,4,5,0,true); // MAINL J-N 1-4
makeABlock(156,152,7,2,0,true); // MAINL J-K 5-11
makeABlock(156,176,8,3,0,true); // MAINL L-N 5-12
makeABlock(156,212,7,3,0,true); // MAINL O-R

makeABlock(252,32,9,2); // MAINR A-B
makeABlock(252,56,10,3,1); // MAINR C-E
makeABlock(252,92,15,3); // MAINR F-H

makeABlock(324,152,4,2); // MAINR J-K 1-4
makeABlock(264,176,9,3); // MAINR L-N 1-9
makeARow(252,212,10); // MAINR O 1-10
makeABlock(276,224,8,2); // MAINR P-R 1-8
makeARow(288,248,7); // MAINR S 1-7
makeABlock(384,152,7,9); // MAINR J-S 5- etc (block of 7 side)


makeARow(468,413,3); // Balcony Turret BALCT

makeABlock(180,452,11,2); // BALCC A-B
makeABlock(180,476,12,2); // BALCC C-D
makeARow(180,500,13); // BALCC E

makeABlock(204,536,8,4); // BALCC F-J

makeARow(360,452,9); // BALCR A
makeABlock(360,464,8,2); // BALCR B-C
makeABlock(360,488,7,2); // BALCR D-E

makeABlock(360,536,7,5); // BALCR F-K
makeARow(360,596,10); // BALCR L
makeABlock(360,608,9,3); // BALCR M-O

makeABlock(144,452,7,2,1,true); // BALCL A-B
makeABlock(144,476,7,3,0,true); // BALCL C-E

makeABlock(144,536,7,5,0,true); // BALCL F-K
makeABlock(144,596,9,3,0,true); // BALCL L-N
makeARow(144,632,8,true); // BALCl O


/***********************************************
 * THE MAIN FUNCTION STARTS WITH WINDOW ONLOAD *
 ***********************************************/

function canvasApp() {

// Label rows starting with row A or with a different starting value "alt"
// copy is the number of pixels to repeat row, and copy_qty is how many repeats
function labelRows(crd1, crd2, qty, alt, copy, copyQty) {

    // Adjust starting integer and qty if appropriate:
    var int;
    if (typeof alt == 'number') {int = alt; qty += alt} else {int = 0};

    for (x=int; x<qty; x++) {

        context.fillText(rows[x], crd1, crd2);

        if ( (typeof copy == 'number') && (typeof copyQty == 'number') ) {
            var crd3 = copy + crd1;
            for (y=0; y<copyQty; y++) {
                context.fillText(rows[x], crd3, crd2);
                crd3 += copy;
            }
        }
        crd2 += 12;
    }

} // end labelRows

// Get a reference to the HTML canvas and 2D context:
var theCanvas = document.getElementById("canvasOne");
var context = theCanvas.getContext("2d");


   // Draw the canvas when called:
   function drawScreen() {

      // Reset "selected" values and "previous" values, flag undoSnapshot:
      qtySelected = 0;
      for (i=0; i<seatMapArray.length; i++) {seatMapArray[i][4]=false; seatMapArray[i][3]=seatMapArray[i][2];}
      undoSnapshotNeeded = true;

      // Make sure there is an actual difference between current PL and "undo" PL
      canUndo = false;
      for (i=0; i<seatMapArray.length; i++) {
          if (seatMapArray[i][2] != seatMapArray[i][5]) {canUndo = true; break;}
      }

      if (standingUndoColor != standingColor) {canUndo = true;} // same for standing section

      // Don't draw the square until mousedown:
      activeSquare = false;

        // Blank the screen for starters:
        context.fillStyle = "#d3d3d3";
        context.fillRect(0, 0, 782, 680);


/**************************************
 * DRAW THE MAP AND ADJUST QUANTITIES *
 **************************************/

        function drawMap() {

            // Font setup for row/section labels
            context.font = '10px Arial';
            context.fillStyle = '#424242';
            context.textAlign = 'center';

            // label rows:
            labelRows(239,41,8,0); // Main Floor A-H
            labelRows(239,161,6,8); // Main Floor J-O (Center)
            labelRows(174,221,3,13); // Main Floor O-R (left)
            labelRows(316,161,2,8); // Main Floor J-K (Right)
            labelRows(269,233,3,14); // Main Floor P-S (Right)
            labelRows(456,422,1,17); // Balcony Turret
            labelRows(167,461,5,0); // Balcony A-E (Left)
            labelRows(348,461,5,0); // Balcony A-E (Right)
            labelRows(167,545,9,5); // Balcony F-O (Left)
            labelRows(348,545,9,5); // Balcony F-O (Right)
            labelRows(308,545,4,5); // Balcony F-J

            // label sections:
            context.fillText('Main Left',190,26);
            context.fillText('Main Right',290,26);
            context.fillText('General Admission Standing (55 GA)',254,298);
            context.fillText('Balcony Turret',470,406);
            context.fillText('Balcony Left',122,442);
            context.fillText('Balcony Center',246,442);
            context.fillText('Balcony Right',396,442);

            // line separator and floor labels:
            context.fillText('MAIN FLOOR',50,20);
            context.fillText('BALCONY',50,398);
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(12,380);
            context.lineTo(502,380); // balcony line
            context.strokeStyle = 'darkgray';
            context.stroke();

            // Loop through seat array and draw:
            for (i=0; i<seatMapArray.length; i++) {

                // Test for 'selected' values outside of the square (i.e., box is shrinking)
                // and reset them, reduce qtys:
                if ( (activeSquare==true) && (seatMapArray[i][4] == true) && ( edgeLeft>=(seatMapArray[i][0]+10) || edgeRight<=seatMapArray[i][0] || edgeTop>=(seatMapArray[i][1]+10) || edgeBottom<=seatMapArray[i][1] ) ) {

                        // If selection changed within current square, revert
                        // to previous selection and adjust quantities:
                        if (seatMapArray[i][2] != seatMapArray[i][3]) {

                            if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                            else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                            else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                            else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                            else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                            else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                            else if (seatMapArray[i][2] == 'none') {qtyNone--;}

                            if (seatMapArray[i][3] == 'PL1') {qtyPL1++; seatMapArray[i][2] = 'PL1';}
                            else if (seatMapArray[i][3] == 'PL2') {qtyPL2++; seatMapArray[i][2] = 'PL2';}
                            else if (seatMapArray[i][3] == 'PL3') {qtyPL3++; seatMapArray[i][2] = 'PL3';}
                            else if (seatMapArray[i][3] == 'PL4') {qtyPL4++; seatMapArray[i][2] = 'PL4';}
                            else if (seatMapArray[i][3] == 'PL5') {qtyPL5++; seatMapArray[i][2] = 'PL5';}
                            else if (seatMapArray[i][3] == 'PL6') {qtyPL6++; seatMapArray[i][2] = 'PL6';}
                            else if (seatMapArray[i][3] == 'none') {qtyNone++; seatMapArray[i][2] = 'none';}

                        }

                        seatMapArray[i][4] = false;
                        qtySelected --;

                } // end selected values outside of square

                // If selected, set line with bold, assign price level, adjust quantities:
                if ( activeSquare==true && edgeLeft<(seatMapArray[i][0]+10) && edgeRight>seatMapArray[i][0] && edgeTop<(seatMapArray[i][1]+10) && edgeBottom>seatMapArray[i][1] ) {

                    context.lineWidth = 2;

                    // If status of seat is changing, adjust quantities accordingly:
                    if (currentPriceLevel == 'PL1' && seatMapArray[i][2] != 'PL1') {
                      qtyPL1++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    } else if (currentPriceLevel == 'PL2' && seatMapArray[i][2] != 'PL2') {
                      qtyPL2++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    } else if (currentPriceLevel == 'PL3' && seatMapArray[i][2] != 'PL3') {
                      qtyPL3++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    } else if (currentPriceLevel == 'PL4' && seatMapArray[i][2] != 'PL4') {
                      qtyPL4++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    } else if (currentPriceLevel == 'PL5' && seatMapArray[i][2] != 'PL5') {
                      qtyPL5++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    } else if (currentPriceLevel == 'PL6' && seatMapArray[i][2] != 'PL6') {
                      qtyPL6++;
                      if (seatMapArray[i][2] == 'none') {qtyNone--;}
                      else if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                    } else if (currentPriceLevel == 'none' && seatMapArray[i][2] != 'none') {
                      qtyNone++;
                      if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                      else if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                      else if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                      else if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                      else if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                      else if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                    }

                    // Assign new selections if changed:
                    if (seatMapArray[i][2] != currentPriceLevel) {

                        // if "undo" snapshot is needed, take it now before changes are made then set to false:
                        if (undoSnapshotNeeded == true) {

                            for (y=0; y<seatMapArray.length; y++) {
                                seatMapArray[y][5] = seatMapArray[y][2];
                            }
                        }
                        if (inStanding==false) {standingUndoColor = standingColor;} // i.e., standing no longer eligible for redo, so reset
                        inTheMap = true; // i.e., don't reset the map undo values when you get to the standing section
                        undoSnapshotNeeded = false;

                        // Then make the change:
                        seatMapArray[i][3] = seatMapArray[i][2];
                        seatMapArray[i][2] = currentPriceLevel;
                        canUndo = true;
                        if (addPanelIcon == false) {addPanelIcon = 'waitingForMouseUp';}
                    }

                    // If it wasn't selected before, it is now:
                    if (seatMapArray[i][4] == false) {
                        seatMapArray[i][4] = true;
                        qtySelected ++;
                    }

                    // Stroke each seat rectangle if no PL is selected:
                    context.strokeStyle = '#000';
                    if (currentPriceLevel == 'none') {context.strokeRect(seatMapArray[i][0],seatMapArray[i][1],10,10);}

                } // end if active square

                // Fill the seat with the appropriate color, if other than white(blank):
                if ( (currentPriceLevel != 'none') && (seatMapArray[i][4] == true) ) {
                    if (currentPriceLevel == 'PL1') {context.fillStyle = '#7AC5CD'}
                    else if (currentPriceLevel == 'PL2') {context.fillStyle = '#FFFF00'}
                    else if (currentPriceLevel == 'PL3') {context.fillStyle = '#FF9912'}
                    else if (currentPriceLevel == 'PL4') {context.fillStyle = '#E600D6'}
                    else if (currentPriceLevel == 'PL5') {context.fillStyle = '#73F973'}
                    else if (currentPriceLevel == 'PL6') {context.fillStyle = '#FF0000'}
                    context.fillRect(seatMapArray[i][0],seatMapArray[i][1],10,10);
                } else if (seatMapArray[i][2] == 'none') {
                    context.fillStyle = '#fff';
                } else if (seatMapArray[i][2] != 'none') {
                    if (seatMapArray[i][2] == 'PL1') {context.fillStyle = '#7AC5CD';}
                    else if (seatMapArray[i][2] == 'PL2') {context.fillStyle = '#FFFF00';}
                    else if (seatMapArray[i][2] == 'PL3') {context.fillStyle = '#FF9912';}
                    else if (seatMapArray[i][2] == 'PL4') {context.fillStyle = '#E600D6';}
                    else if (seatMapArray[i][2] == 'PL5') {context.fillStyle = '#73F973';}
                    else if (seatMapArray[i][2] == 'PL6') {context.fillStyle = '#FF0000';}
                }

                context.fillRect(seatMapArray[i][0],seatMapArray[i][1],10,10);

            } // end seatMapArray for loop


/*********************************
 * THEN STANDING ROOM FUNCTIONS: *
 * *******************************/

            // If our square is leaving the standing section, reset everything:
            if ( (inStanding==true) && (edgeLeft>407 || edgeRight<107 || edgeTop>355 || edgeBottom<305) ) {

                    qtySelected -= 55;

                    // This is to add the standing section qty to previous price level:
                    function increase() {
                        if (standingPreviousColor=='#fff'){qtyNone+=55}
                        if (standingPreviousColor=='#7AC5CD'){qtyPL1+=55}
                        if (standingPreviousColor=='#FFFF00'){qtyPL2+=55}
                        if (standingPreviousColor=='#FF9912'){qtyPL3+=55}
                        if (standingPreviousColor=='#E600D6'){qtyPL4+=55}
                        if (standingPreviousColor=='#73F973'){qtyPL5+=55}
                        if (standingPreviousColor=='#FF0000'){qtyPL6+=55}
                    }

                    if (currentPriceLevel == 'none' && standingPreviousColor != '#fff') {increase(); qtyNone-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL1' && standingPreviousColor != '#7AC5CD') {increase(); qtyPL1-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL2' && standingPreviousColor != '#FFFF00') {increase(); qtyPL2-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL3' && standingPreviousColor != '#FF9912') {increase(); qtyPL3-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL4' && standingPreviousColor != '#E600D6') {increase(); qtyPL4-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL5' && standingPreviousColor != '#73F973') {increase(); qtyPL5-=55; standingColor=standingPreviousColor;}
                    if (currentPriceLevel == 'PL6' && standingPreviousColor != '#FF0000') {increase(); qtyPL6-=55; standingColor=standingPreviousColor;}

                    inStanding = false;

            }

            // And if our square entering the standing section, there is stuff to do:
            if (( inStanding==false && edgeLeft<407 && edgeRight>107 && edgeTop<355 && edgeBottom>305 ) || standingClick==true) {

                standingUndoColor=standingColor;

                // If the selection square is not also in the main map, the undo values need to be reset:
                if (!inTheMap) {

                    for (z=0; z<seatMapArray.length; z++) {
                        seatMapArray[z][5] = seatMapArray[z][2];
                    }

                    canUndo = true;
                    addPanelIcon = 'waitingForMouseUp';
                }

                qtySelected += 55;

                // This is to drop the standing section qty from previous price level:
                function reduce() {
                    if (standingColor=='#fff'){qtyNone-=55}
                    if (standingColor=='#7AC5CD'){qtyPL1-=55}
                    if (standingColor=='#FFFF00'){qtyPL2-=55}
                    if (standingColor=='#FF9912'){qtyPL3-=55}
                    if (standingColor=='#E600D6'){qtyPL4-=55}
                    if (standingColor=='#73F973'){qtyPL5-=55}
                    if (standingColor=='#FF0000'){qtyPL6-=55}
                }

                if (currentPriceLevel == 'none' && standingColor != '#fff') {reduce(); qtyNone+=55; standingPreviousColor=standingColor; standingColor='#fff'}
                if (currentPriceLevel == 'PL1' && standingColor != '#7AC5CD') {reduce(); qtyPL1+=55; standingPreviousColor=standingColor; standingColor='#7AC5CD'}
                if (currentPriceLevel == 'PL2' && standingColor != '#FFFF00') {reduce(); qtyPL2+=55; standingPreviousColor=standingColor; standingColor='#FFFF00'}
                if (currentPriceLevel == 'PL3' && standingColor != '#FF9912') {reduce(); qtyPL3+=55; standingPreviousColor=standingColor; standingColor='#FF9912'}
                if (currentPriceLevel == 'PL4' && standingColor != '#E600D6') {reduce(); qtyPL4+=55; standingPreviousColor=standingColor; standingColor='#E600D6'}
                if (currentPriceLevel == 'PL5' && standingColor != '#73F973') {reduce(); qtyPL5+=55; standingPreviousColor=standingColor; standingColor='#73F973'}
                if (currentPriceLevel == 'PL6' && standingColor != '#FF0000') {reduce(); qtyPL6+=55; standingPreviousColor=standingColor; standingColor='#FF0000'}

                inStanding = true;

            } // entering standing section

            // Now draw the standing section:
            context.beginPath();
            context.rect(108,306,298,48);
            //context.rect(12,765,490,100);
            context.fillStyle=standingColor;
            context.fill();
            if (inStanding==true && currentPriceLevel=='none') {context.strokeStyle = '#000'; context.lineWidth=1; context.stroke();} // bold edge if no price level

            // Complete selection square within standing section if needed:
            if (activeSquare==true && inStanding==true && edgeBottom!=0 && edgeRight!=0) {
                var a=108; var b=306; var c=298; var d=48; // manipulate these standing section rec coords as needed
                if (edgeLeft>107) {a=edgeLeft; c-=edgeLeft-107;}
                if (edgeRight<407) {c-=(407-edgeRight);}
                if (edgeTop>305) {b=edgeTop; d-=(edgeTop-305);}
                if (edgeBottom<355) {d-=(355-edgeBottom);}
                context.beginPath();
                context.rect(a,b,c,d);
                if (standingColor=="#fff") {context.fillStyle = '#d3d3d3'; context.fill();} else {context.lineWidth=1; context.strokeStyle = '#8B4513'; context.stroke();}
            }


/************************************
 * DRAW CONTROL PANEL - UPPER ICONS *
 ************************************/

            // Now draw the control panel (starting coords panelX=517,panelY=20)
            context.fillStyle = 'darkgray';
            context.fillRect(panelX,panelY,250,460);

            // ** QUANTITY SELECTED **
            if (qtySelected > 0) {
                context.font = '10px Arial';
                context.fillStyle = '#8B4513';
                context.textAlign = 'right';
                context.fillText(qtySelected, panelX+34, panelY+19);
            }

            // ** UNDO/REDO **
            if ( (addPanelIcon == true) && (canUndo == true) && ((qtyNone < 766) || (canRedo == true)) ) {
                if (redoing == true) {context.fillStyle = '#909090';} else {context.fillStyle = '#808080'}
                context.beginPath();
                context.moveTo(panelX+104,panelY+14);
                context.lineTo(panelX+101,panelY+11);
                context.lineTo(panelX+101,panelY+21);
                context.lineTo(panelX+110,panelY+21);
                context.lineTo(panelX+107,panelY+17);
                context.arcTo(panelX+114,panelY+10,panelX+119,panelY+18,9);
                context.arcTo(panelX+124,panelY+26,panelX+116,panelY+29,9);
                context.arcTo(panelX+109,panelY+33,panelX+106,panelY+25,8);
                context.lineTo(panelX+106,panelY+25);
                context.lineTo(panelX+101,panelY+25);
                context.arcTo(panelX+108,panelY+37,panelX+121,panelY+31,13);
                context.arcTo(panelX+128,panelY+23,panelX+122,panelY+15,13);
                context.arcTo(panelX+110,panelY+8,panelX+104,panelY+14,13);
                context.lineTo(panelX+104,panelY+15);
                context.closePath();
                context.fill();
                redoing = false;
            }

            // Color for remaining icons:
            context.strokeStyle = '#808080';
            context.fillStyle = '#808080';

            // ** RESET CANVAS && SAVE ARE BASED ON THE SAME CONDITION **
            if ( (addPanelIcon == true) && (qtyNone < 55) ) {

                // Reset canvas icon:
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(panelX+139,panelY+13);
                context.lineTo(panelX+158,panelY+13);
                context.lineTo(panelX+167,panelY+19);
                context.arcTo(panelX+169,panelY+21,panelX+167,panelY+23,2);
                context.lineTo(panelX+158,panelY+31);
                context.lineTo(panelX+139,panelY+31);
                context.arcTo(panelX+136,panelY+31,panelX+136,panelY+29,2);
                context.lineTo(panelX+136,panelY+15);
                context.arcTo(panelX+136,panelY+13,panelX+139,panelY+13,2);
                context.lineTo(panelX+139,panelY+13);
                context.stroke();

                context.beginPath();
                context.moveTo(panelX+144,panelY+17);
                context.lineTo(panelX+154,panelY+27);
                context.stroke();

                context.beginPath();
                context.moveTo(panelX+154,panelY+17);
                context.lineTo(panelX+144,panelY+27);
                context.stroke();

                // Save icon:
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(panelX+180,panelY+11);
                context.lineTo(panelX+186,panelY+11);
                context.lineTo(panelX+186,panelY+20);
                context.lineTo(panelX+197,panelY+20);
                context.lineTo(panelX+197,panelY+11);
                context.lineTo(panelX+200,panelY+11);
                context.lineTo(panelX+203,panelY+14);
                context.lineTo(panelX+203,panelY+33);
                context.lineTo(panelX+180,panelY+33);
                context.closePath();
                context.fill();

                context.beginPath();
                context.moveTo(panelX+192,panelY+12);
                context.lineTo(panelX+195,panelY+12);
                context.lineTo(panelX+195,panelY+18);
                context.lineTo(panelX+192,panelY+18);
                context.closePath();
                context.fill();

                context.fillStyle = 'darkgray';
                context.beginPath();
                context.moveTo(panelX+183,panelY+22);
                context.lineTo(panelX+200,panelY+22);
                context.lineTo(panelX+200,panelY+31);
                context.lineTo(panelX+183,panelY+31);
                context.closePath();
                context.fill();
            }

            // ** DRAG PANEL **
            context.lineWidth = 2;
            context.beginPath();
            if ( (dragPanel == true)) { // draw closed hand
                context.moveTo(panelX+235,panelY+32);
                context.lineTo(panelX+224,panelY+32);
                context.lineTo(panelX+223,panelY+30);
                context.arcTo(panelX+216,panelY+24,panelX+218,panelY+23,1);
                context.lineTo(panelX+217,panelY+21);
                context.arcTo(panelX+217,panelY+21,panelX+218,panelY+20,1)
                context.lineTo(panelX+221,panelY+20);
                context.lineTo(panelX+220,panelY+17);
                context.lineTo(panelX+218,panelY+17);
                context.lineTo(panelX+218,panelY+14);
                context.arcTo(panelX+219,panelY+13,panelX+220,panelY+13,1)
                context.lineTo(panelX+223,panelY+13);
                context.arcTo(panelX+225,panelY+13,panelX+225,panelY+14,1)
                context.lineTo(panelX+225,panelY+16);
                context.lineTo(panelX+225,panelY+12);
                context.arcTo(panelX+226,panelY+11,panelX+227,panelY+11,1)
                context.arcTo(panelX+229,panelY+11,panelX+229,panelY+12,1)
                context.lineTo(panelX+229,panelY+16);
                context.lineTo(panelX+229,panelY+12);
                context.lineTo(panelX+232,panelY+12);
                context.arcTo(panelX+233,panelY+12,panelX+233,panelY+14,1)
                context.lineTo(panelX+233,panelY+17);
                context.lineTo(panelX+233,panelY+14);
                context.lineTo(panelX+236,panelY+14);
                context.arcTo(panelX+238,panelY+14,panelX+238,panelY+16,3)
                context.lineTo(panelX+238,panelY+21);
                context.arcTo(panelX+236,panelY+26,panelX+235,panelY+28,2)
            } else { // draw open hand
                context.moveTo(panelX+235,panelY+32);
                context.lineTo(panelX+224,panelY+32);
                context.lineTo(panelX+223,panelY+30);
                context.lineTo(panelX+217,panelY+25);
                context.arcTo(panelX+217,panelY+20,panelX+219,panelY+21,1);
                context.lineTo(panelX+219,panelY+21);
                context.lineTo(panelX+223,panelY+24);
                context.lineTo(panelX+222,panelY+18);
                context.lineTo(panelX+220,panelY+16);
                context.arcTo(panelX+220,panelY+13,panelX+223,panelY+13,1);
                context.lineTo(panelX+223,panelY+14);
                context.lineTo(panelX+226,panelY+19);
                context.lineTo(panelX+226,panelY+12);
                context.arcTo(panelX+226,panelY+11,panelX+228,panelY+11,1);
                context.arcTo(panelX+230,panelY+11,panelX+230,panelY+12,1);
                context.lineTo(panelX+230,panelY+21);
                context.lineTo(panelX+230,panelY+12);
                context.arcTo(panelX+235,panelY+12,panelX+235,panelY+14,2);
                context.lineTo(panelX+235,panelY+20);
                context.lineTo(panelX+237,panelY+16);
                context.arcTo(panelX+239,panelY+16,panelX+239,panelY+18,2);
                context.lineTo(panelX+239,panelY+22);
            }
            context.closePath();
            context.stroke();


/**************************************
 * DRAW CONTROL PANEL - PRICE BUTTONS *
 **************************************/

            // Reset Gross Potential:
            revenueCume = 0;

            // Then each price button in turn, adjusting revenue as needed:
            context.font = '14px Arial';
            context.textAlign = 'center';
            context.strokeStyle = '#424242';

            if (currentPriceLevel == 'PL1') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+45,210,25);
            context.fillStyle = '#7AC5CD';
            context.fillRect(panelX+20,panelY+45,210,25);
            context.fillStyle = '#8B4513';
            context.fillStyle = '#000';
            context.fillText('Price 1', panelX+125, panelY+62);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL1, panelX+20, panelY+85);
            context.textAlign = 'right';
            priceToPrint = pricePL1.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+85);
            revenueToPrint = (qtyPL1 * pricePL1);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+85);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+80);
            context.lineTo(panelX+127,panelY+74);
            context.lineTo(panelX+132,panelY+80);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+81);
            context.lineTo(panelX+127,panelY+87);
            context.lineTo(panelX+132,panelY+81);
            context.closePath();
            context.fill();

            if (currentPriceLevel == 'PL2') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+100,210,25);
            context.fillStyle = '#FFFF00';
            context.fillRect(panelX+20,panelY+100,210,25);
            context.fillStyle = '#8B4513';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText('Price 2', panelX+125, panelY+117);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL2, panelX+20, panelY+140);
            context.textAlign = 'right';
            priceToPrint = pricePL2.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+140);
            revenueToPrint = (qtyPL2 * pricePL2);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+140);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+135);
            context.lineTo(panelX+127,panelY+129);
            context.lineTo(panelX+132,panelY+135);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+136);
            context.lineTo(panelX+127,panelY+142);
            context.lineTo(panelX+132,panelY+136);
            context.closePath();
            context.fill();

            if (currentPriceLevel == 'PL3') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+155,210,25);
            context.fillStyle = '#FF9912';
            context.fillRect(panelX+20,panelY+155,210,25);
            context.fillStyle = '#8B4513';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText('Price 3', panelX+125, panelY+172);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL3, panelX+20, panelY+195);
            context.textAlign = 'right';
            priceToPrint = pricePL3.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+195);
            revenueToPrint = (qtyPL3 * pricePL3);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+195);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+190);
            context.lineTo(panelX+127,panelY+184);
            context.lineTo(panelX+132,panelY+190);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+191);
            context.lineTo(panelX+127,panelY+197);
            context.lineTo(panelX+132,panelY+191);
            context.closePath();
            context.fill();

            if (currentPriceLevel == 'PL4') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+210,210,25);
            context.fillStyle = '#E600D6';
            context.fillRect(panelX+20,panelY+210,210,25);
            context.fillStyle = '#8B4513';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText('Price 4', panelX+125, panelY+227);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL4, panelX+20, panelY+250);
            context.textAlign = 'right';
            priceToPrint = pricePL4.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+250);
            revenueToPrint = (qtyPL4 * pricePL4);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+250);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+245);
            context.lineTo(panelX+127,panelY+239);
            context.lineTo(panelX+132,panelY+245);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+246);
            context.lineTo(panelX+127,panelY+252);
            context.lineTo(panelX+132,panelY+246);
            context.closePath();
            context.fill();

            if (currentPriceLevel == 'PL5') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+265,210,25);
            context.fillStyle = '#73F973';
            context.fillRect(panelX+20,panelY+265,210,25);
            context.fillStyle = '#8B4513';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText('Price 5', panelX+125, panelY+282);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL5, panelX+20, panelY+305);
            context.textAlign = 'right';
            priceToPrint = pricePL5.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+305);
            revenueToPrint = (qtyPL5 * pricePL5);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+305);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+300);
            context.lineTo(panelX+127,panelY+294);
            context.lineTo(panelX+132,panelY+300);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+301);
            context.lineTo(panelX+127,panelY+307);
            context.lineTo(panelX+132,panelY+301);
            context.closePath();
            context.fill();

            if (currentPriceLevel == 'PL6') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1;}
            context.strokeRect(panelX+20,panelY+320,210,25);
            context.fillStyle = '#FF0000';
            context.fillRect(panelX+20,panelY+320,210,25);
            context.fillStyle = '#8B4513';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText('Price 6', panelX+125, panelY+337);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.fillText(qtyPL6, panelX+20, panelY+360);
            context.textAlign = 'right';
            priceToPrint = pricePL6.toFixed(2);
            context.fillText('$'+priceToPrint, panelX+120, panelY+360);
            revenueToPrint = (qtyPL6 * pricePL6);
            revenueCume += revenueToPrint;
            revenueToPrint = revenueToPrint.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueToPrint,panelX+230, panelY+360);
            context.fillStyle = '#424242';
            context.beginPath(); // Up arrow
            context.moveTo(panelX+122,panelY+355);
            context.lineTo(panelX+127,panelY+349);
            context.lineTo(panelX+132,panelY+355);
            context.closePath();
            context.fill();
            context.beginPath(); // Down arrow
            context.moveTo(panelX+122,panelY+356);
            context.lineTo(panelX+127,panelY+362);
            context.lineTo(panelX+132,panelY+356);
            context.closePath();
            context.fill();

            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(panelX+20,panelY+375);
            context.lineTo(panelX+230,panelY+375);
            context.stroke();

            context.beginPath();
            context.moveTo(panelX+20,panelY+380);
            context.lineTo(panelX+230,panelY+380);
            context.stroke();

            context.textAlign = 'left';
            context.font = 'bold 14px Arial';
            context.fillStyle = '#000';
            qtyAssigned = qtyPL1+qtyPL2+qtyPL3+qtyPL4+qtyPL5+qtyPL6;
            context.fillText(qtyAssigned, panelX+20, panelY+395);

            context.textAlign = 'right';
            revenueCume = revenueCume.toLocaleString('en', { minimumFractionDigits: 2 });
            context.fillText('$'+revenueCume, panelX+230, panelY+395);

            context.strokeStyle = '#000';
            if (currentPriceLevel == 'none') {context.lineWidth=5; context.font='bold 14px Arial';} else {context.lineWidth=1; context.font='14px Arial';}
            context.strokeRect(panelX+20,panelY+420,170,25);
            context.fillStyle = '#FFF';
            context.fillRect(panelX+20,panelY+420,170,25);
            context.fillStyle = '#000';
            context.textAlign = 'center';
            context.fillText('Unassigned Seats', panelX+105, panelY+437);
            context.font = '14px Arial';
            context.textAlign = 'left';
            context.font = '14px Arial';
            context.textAlign = 'right';
            context.fillText(qtyNone, panelX+230, panelY+435);

        } // end drawMap

        // drawMap function is built, now run it:
        drawMap();

        // Return x/y mouse coordinates when called:
        function getMousePos(canvas, evt) {
          var rect = canvas.getBoundingClientRect();
          return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
          };
        }


/*************************************
 * DRAW SELECTION SQUARE WHEN CALLED *
 *************************************/

        // Blank the screen and draw a square, do standing section stuff if needed:
        function drawSquare(x,y,a,b) {

            context.fillStyle = '#d3d3d3';
            context.fillRect(0, 0, 1500, 880);
            context.fillStyle = '#fff';
            context.lineWidth = 1;
            context.strokeStyle = '#8B4513';
            context.strokeRect(x,y,a,b);
            context.fillRect(x,y,a,b);

        // Redraw the map:
        drawMap();

        } // End drawSquare


/********************
 * MOUSEUP FUNCTION *
 ********************/

      // On mouseup, cancel event listeners (drawScreen will readd them) and redraw the canvas:
      function upped() {
          document.removeEventListener('mousemove', moved);
          document.removeEventListener('mousemove', panelMove);
          document.removeEventListener('mouseup', upped);
          canvasOne.removeEventListener('dblclick', double);
          window.removeEventListener('scroll', scrollFunction);
          if ( (addPanelIcon == 'waitingForMouseUp') && (qtyNone < 766) ) {addPanelIcon = true;}
          dragPanel = false;
          inStanding = false;
          inTheMap = false;
          standingClick = false;
          resetEdge(); // mouseup = no more square
          drawScreen();
      }


/***************************************************
 * CURSOR DRAG FUNCTION (OUTSIDE OF CONTROL PANEL) *
 ***************************************************/

      // On mousemove, draw selection square, etc., if appropriate:
      function moved(evt) {

            standingClick=false; // Now we're dragging, not just a click anymore

            /* Just because the mouse is moving doesn't mean we should
               draw the square.  Make sure activeSquare flag is set, then
               start drawing */

            if (activeSquare == true) {


                // Set width and height of square based on current mouse position:
                var mousePos2 = getMousePos(canvasOne, evt);

                    selectWidth = mousePos2.x - selectX;
                    selectHeight = mousePos2.y - selectY;

                        // Set absolute selection edges, whether selectX is top-left or bottom-right:
                        if (selectX<(selectX+selectWidth)) {edgeLeft=selectX;edgeRight=(selectX+selectWidth);} else {edgeLeft=(selectX+selectWidth);edgeRight=selectX;}
                        if (selectY<(selectY+selectHeight)) {edgeTop=selectY;edgeBottom=(selectY+selectHeight);} else {edgeTop=(selectY+selectHeight);edgeBottom=selectY;}

                            // If cursor is within a seat square, conform the selection square to its edges:
                            for (i=0; i<seatMapArray.length; i++) {

                                if ( (edgeLeft > seatMapArray[i][0]) && (edgeLeft < (seatMapArray[i][0]+10) ) ) {
                                    edgeLeft = seatMapArray[i][0];
                                }
                                if ( (edgeTop > seatMapArray[i][1]) && (edgeTop < (seatMapArray[i][1]+10) ) ) {
                                    edgeTop = seatMapArray[i][1];
                                }
                                if ( (edgeRight < (seatMapArray[i][0]+10) ) && (edgeRight > seatMapArray[i][0]) ) {
                                    edgeRight = seatMapArray[i][0]+10;
                                }
                                if ( (edgeBottom > seatMapArray[i][1]) && (edgeBottom < (seatMapArray[i][1]+10) ) ) {
                                    edgeBottom = seatMapArray[i][1]+10;
                                }

                            } // END FOR

                        if (mousePos2.x<1) {edgeLeft = 1;}
                        if (mousePos2.x>781) {edgeRight = 781;}
                        if (mousePos2.y<1) {edgeTop = 1;}
                        if (mousePos2.y>679) {edgeBottom = 679;}

                        // Adjust width and height accordingly, then draw the square:
                        selectWidth = edgeRight-edgeLeft;
                        selectHeight = edgeBottom-edgeTop;

                        drawSquare(edgeLeft,edgeTop,selectWidth,selectHeight);

            } // End activeSquare=true

        } // End of Moved


/***************************************************
 * CURSOR DRAG FUNCTION (INSIDE THE CONTROL PANEL) *
 ***************************************************/

      function panelMove(evt) {

              // blank out screen behind current box, it's about to move:
              context.fillStyle = '#d3d3d3';
              context.fillRect(0,0,782,680);

              var mousePos3 = getMousePos(canvasOne, evt);
              panelX = mousePos3.x - deltaX;
              panelY = mousePos3.y - deltaY;

              // Reset coordinates if outside canvas bounds:
              if (panelX <0) {panelX = 0;}
              if (panelX >532) {panelX = 532;}
              if (panelY <0) {panelY = 0;}
              if (panelY >220) {panelY = 220;}
              drawMap();

      } // end of panelMove


/******************
 * CLICK FUNCTION *
 ******************/

      // Listen for mousedown so we can start drawing the square:
      function clicked(evt) {

        canvasOne.removeEventListener('mousedown', clicked);

        // Reset screen on mouseup:
        document.addEventListener('mouseup', upped);

        // Set x/y coordinates based on mouse position at time of click:
        var mousePos = getMousePos(canvasOne, evt);
        selectX = mousePos.x;
        selectY = mousePos.y;


/**********************************
 * FIRST, CONTROL PANEL FUNCTIONS *
 **********************************/

            // Make sure we are inside the control panel:
            if ( (selectX >= panelX) && (selectX <= (panelX+250) ) && (selectY >= panelY) && (selectY <= (panelY+460) ) ) {

                // ** CONTROL BUTTONS **

                // Are we within vertical bounds of control buttons?
                if ( (selectY>=(panelY+11)) && (selectY<=(panelY+33)) ) {


                    // ** UNDO/REDO ** || CLICK FUNCTION:
                    if ( (selectX >= (panelX+100)) && (selectX <= (panelX+125)) && (addPanelIcon == true) && (canUndo == true) && ((qtyNone < 766) || (canRedo == true)) ) {

                            // Loop through seat array and reassign previous PL:
                            var jugglePL; // catches [i][5] temporarily so that [i][2]/[i][5] can be juggled
                            for (i=0; i<seatMapArray.length; i++) {

                                // Adjust quantities and swap, only if there is a change:
                                if (seatMapArray[i][2] != seatMapArray[i][5]) {

                                    if (seatMapArray[i][2] == 'PL1') {qtyPL1--;}
                                    if (seatMapArray[i][2] == 'PL2') {qtyPL2--;}
                                    if (seatMapArray[i][2] == 'PL3') {qtyPL3--;}
                                    if (seatMapArray[i][2] == 'PL4') {qtyPL4--;}
                                    if (seatMapArray[i][2] == 'PL5') {qtyPL5--;}
                                    if (seatMapArray[i][2] == 'PL6') {qtyPL6--;}
                                    if (seatMapArray[i][2] == 'none') {qtyNone--;}

                                    if (seatMapArray[i][5] == 'PL1') {qtyPL1++;}
                                    if (seatMapArray[i][5] == 'PL2') {qtyPL2++;}
                                    if (seatMapArray[i][5] == 'PL3') {qtyPL3++;}
                                    if (seatMapArray[i][5] == 'PL4') {qtyPL4++;}
                                    if (seatMapArray[i][5] == 'PL5') {qtyPL5++;}
                                    if (seatMapArray[i][5] == 'PL6') {qtyPL6++;}
                                    if (seatMapArray[i][5] == 'none') {qtyNone++;}

                                    jugglePL = seatMapArray[i][5];
                                    seatMapArray[i][5] = seatMapArray[i][2];
                                    seatMapArray[i][2] = jugglePL;

                                } // if !=

                            } // for loop

                            // Do the same for standing section:
                            if (standingColor != standingUndoColor) {

                                if (standingColor == '#7AC5CD') {qtyPL1=qtyPL1-55;}
                                if (standingColor == '#FFFF00') {qtyPL2=qtyPL2-55;}
                                if (standingColor == '#FF9912') {qtyPL3=qtyPL3-55;}
                                if (standingColor == '#E600D6') {qtyPL4=qtyPL4-55;}
                                if (standingColor == '#73F973') {qtyPL5=qtyPL5-55;}
                                if (standingColor == '#FF0000') {qtyPL6=qtyPL6-55;}
                                if (standingColor == '#fff') {qtyNone=qtyNone-55;}

                                if (standingUndoColor == '#7AC5CD') {qtyPL1=qtyPL1+55;}
                                if (standingUndoColor == '#FFFF00') {qtyPL2=qtyPL2+55;}
                                if (standingUndoColor == '#FF9912') {qtyPL3=qtyPL3+55;}
                                if (standingUndoColor == '#E600D6') {qtyPL4=qtyPL4+55;}
                                if (standingUndoColor == '#73F973') {qtyPL5=qtyPL5+55;}
                                if (standingUndoColor == '#FF0000') {qtyPL6=qtyPL6+55;}
                                if (standingUndoColor == '#fff') {qtyNone=qtyNone+55;}

                                jugglePL = standingUndoColor;
                                standingUndoColor = standingColor;
                                standingColor = jugglePL;

                            } // standing

                            canRedo = true;
                            redoing = true;

                            // Blank the screen and redraw map:
                            context.fillStyle = "#d3d3d3";
                            context.fillRect(0, 0, 782, 680);

                            drawMap();

                    } // undo/redo


                    // ** RESET ** || CLICK FUNCTION:
                    if ( (selectX >= (panelX+135)) && (selectX <= (panelX+170)) && (addPanelIcon == true) && (qtyNone < 766)  ) {

                        var resetOkay = confirm('Are you sure you want to clear and reset the map and prices?');

                        if (resetOkay) {
                            qtyPL1 = 0;
                            qtyPL2 = 0;
                            qtyPL3 = 0;
                            qtyPL4 = 0;
                            qtyPL5 = 0;
                            qtyPL6 = 0;
                            qtyNone = 766;
                            currentPriceLevel = 'none';
                            resetEdge();
                            pricePL1 = 75;
                            pricePL2 = 60;
                            pricePL3 = 50;
                            pricePL4 = 40;
                            pricePL5 = 30;
                            pricePL6 = 20;
                            standingColor = '#fff';
                            standingPreviousColor = '#fff';

                            for (i=0; i<seatMapArray.length; i++) {
                                seatMapArray[i][2] = 'none';
                                seatMapArray[i][3] = 'none';
                                seatMapArray[i][5] = 'none';
                            }

                            panelX = 517;
                            panelY = 15;
                            addPanelIcon = false;
                            canRedo = false;

                            // Blank the screen and redraw map:
                            context.fillStyle = "#d3d3d3";
                            context.fillRect(0, 0, 782, 680);
                            drawMap();

                        } // resetOkay

                    } // reset


                    // ** SAVE ** || CLICK FUNCTION:
                    if ( (selectX >= (panelX+180)) && (selectX <= (panelX+203)) && (qtyNone < 766) ) {

                        // Reset panel position and redraw map:
                        panelX = 517;
                        panelY = 15;
                        context.fillStyle = "#d3d3d3";
                        context.fillRect(0, 0, 782, 680);
                        drawMap();

                        // Convert canvas image to data URL link:
                        var link = document.createElement('a');
                        link.href = theCanvas.toDataURL();
                        link.download = 'neptune_scaling_map.png';

                        // If I.E., open canvas as image in new window:
                        if (typeof document.documentMode == 'number') { // i.e., is Internet Explorer (value only exists in I.E.)
                            var htmlImg = '<html><body><img src="' + link +'"/><br /><strong>Right click on image and select Save picture as...</strong></body></html>';
                            var win = window.open();
                            win.document.write(htmlImg);
                            canvasOne.addEventListener('mousedown', clicked);
                        } else {

                            // Any other browser, fire the link then remove link:
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }

                    } // save


                    // ** DRAG PANEL ** || CLICK FUNCTION:
                    if ( (selectX >= (panelX+216)) && (selectX <= (panelX+240)) ) {
                        dragPanel = true;

                        // Blank the screen and redraw map:
                        context.fillStyle = "#d3d3d3";
                        context.fillRect(0, 0, 782, 680);
                        drawMap();

                        deltaX = selectX - panelX; // adjust for click position
                        deltaY = selectY - panelY; // adjust for click position
                        document.addEventListener('mousemove', panelMove);
                    }

                } // if within y bounds


//=============>// ** PRICE SELECT BUTTONS **

                // Horizontal selection is within bounds of PL buttons:
                if ( (selectX >= (panelX+20)) && (selectX <= (panelX+230)) ) {

                    // If vertical selection is within bounds of a price button,
                    // set current price level and flag activeSquare to redraw map:
                    if ( (selectY >= (panelY+45)) && (selectY <= (panelY+70)) ) {
                        currentPriceLevel = 'PL1';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+100)) && (selectY <= (panelY+125)) ) {
                        currentPriceLevel = 'PL2';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+155)) && (selectY <= (panelY+180)) ) {
                        currentPriceLevel = 'PL3';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+210)) && (selectY <= (panelY+235)) ) {
                        currentPriceLevel = 'PL4';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+265)) && (selectY <= (panelY+290)) ) {
                        currentPriceLevel = 'PL5';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+320)) && (selectY <= (panelY+345)) ) {
                        currentPriceLevel = 'PL6';
                        activeSquare = true;
                    }
                    if ( (selectY >= (panelY+420)) && (selectY <= (panelY+445)) ) {
                        currentPriceLevel = 'none';
                        activeSquare = true;
                    }


//=============>// ** ADJUST PRICE FUNCTIONS **

                    function adjustPrice(PLX,priceUp) {

                        canvasOne.removeEventListener('mousedown', clicked);

                        // mouse button is down, ready to speed adjust the price in half a second:
                        var adjustingPrice = true;

                        // ...unless the mouse moves or the mouse button goes up, then never mind:
                        function stopAdjusting() {
                            adjustingPrice = false;
                            canvasOne.removeEventListener('mouseup', stopAdjusting);
                            canvasOne.removeEventListener('mousemove', stopAdjusting);
                        }
                        canvasOne.addEventListener('mouseup', stopAdjusting);
                        canvasOne.addEventListener('mousemove', stopAdjusting);

                        if (priceUp==true) { // price is going up

                            if ((PLX == 'pricePL1') && (pricePL1 < 350)) {

                                // adjust up one quarter on initial click:
                                pricePL1 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust() {
                                    pricePL1 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL1==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL1 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust, 20);}}, 500);

                            } else if ((PLX == 'pricePL2') && (pricePL2 <350)) {

                                // adjust up one quarter on initial click:
                                pricePL2 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust2() {
                                    pricePL2 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL2==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL2 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust2, 20);}}, 500);

                            } else if ((PLX == 'pricePL3') && (pricePL3 <350)) {

                                // adjust up one quarter on initial click:
                                pricePL3 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust3() {
                                    pricePL3 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL3==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL3 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust3, 20);}}, 500);

                            } else if ((PLX == 'pricePL4') && (pricePL4 <350)) {

                                // adjust up one quarter on initial click:
                                pricePL4 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust4() {
                                    pricePL4 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL4==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL4 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust4, 20);}}, 500);

                            } else if ((PLX == 'pricePL5') && (pricePL5 <350)) {

                                // adjust up one quarter on initial click:
                                pricePL5 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust5() {
                                    pricePL5 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL5==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL5 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust5, 20);}}, 500);

                            } else if ((PLX == 'pricePL6') && (pricePL6 <350)) {

                                // adjust up one quarter on initial click:
                                pricePL6 += .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust6() {
                                    pricePL6 += .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL6==350) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL6 < 350) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust6, 20);}}, 500);

                            }

                        } else { // price is going down
                            if ((PLX == 'pricePL1') && (pricePL1 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL1 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust7() {
                                    pricePL1 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL1==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL1 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust7, 20);}}, 500);

                            } else if ((PLX == 'pricePL2') && (pricePL2 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL2 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust8() {
                                    pricePL2 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL2==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL2 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust8, 20);}}, 500);

                            } else if ((PLX == 'pricePL3') && (pricePL3 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL3 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust9() {
                                    pricePL3 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL3==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL3 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust9, 20);}}, 500);

                            } else if ((PLX == 'pricePL4') && (pricePL4 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL4 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust10() {
                                    pricePL4 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL4==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL4 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust10, 20);}}, 500);

                            } else if ((PLX == 'pricePL5') && (pricePL5 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL5 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust11() {
                                    pricePL5 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL5==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL5 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust11, 20);}}, 500);

                            } else if ((PLX == 'pricePL6') && (pricePL6 >0)) {

                                // adjust up one quarter on initial click:
                                pricePL6 -= .25;
                                context.fillStyle = "#d3d3d3";
                                context.fillRect(0, 0, 782, 680);
                                drawMap();

                                // and get ready to do it a bunch of times if mouse button stays down:
                                function speedAdjust12() {
                                    pricePL6 -= .25;
                                    context.fillStyle = "#d3d3d3";
                                    context.fillRect(0, 0, 782, 680);
                                    drawMap();
                                    if (pricePL6==0) clearInterval(interval); // max out at 350
                                    if (adjustingPrice==false) clearInterval(interval); // or stop if mouse move or upclick
                                }

                                // do it after half a second:
                                setTimeout(function() {if ( (pricePL6 > 0) && (adjustingPrice == true) ) {interval = setInterval(speedAdjust12, 20);}}, 500);

                            }

                        } // end of price is going down

                    } // adjustPrice

                    // If a price adjustment arrow is clicked:
                    if ((selectX >= (panelX+122)) && (selectX <= (panelX+132)) ) {

                        if ( (selectY >= (panelY+74)) && (selectY <+ (panelY+80)) ) {adjustPrice('pricePL1',true);
                        } else if ( (selectY >= (panelY+81)) && (selectY <+ (panelY+87)) ) {adjustPrice('pricePL1',false);
                        } else if ( (selectY >= (panelY+129)) && (selectY <+ (panelY+135)) ) {adjustPrice('pricePL2',true);
                        } else if ( (selectY >= (panelY+136)) && (selectY <+ (panelY+142)) ) {adjustPrice('pricePL2',false);
                        } else if ( (selectY >= (panelY+184)) && (selectY <+ (panelY+190)) ) {adjustPrice('pricePL3',true);
                        } else if ( (selectY >= (panelY+191)) && (selectY <+ (panelY+197)) ) {adjustPrice('pricePL3',false);
                        } else if ( (selectY >= (panelY+239)) && (selectY <+ (panelY+245)) ) {adjustPrice('pricePL4',true);
                        } else if ( (selectY >= (panelY+246)) && (selectY <+ (panelY+252)) ) {adjustPrice('pricePL4',false);
                        } else if ( (selectY >= (panelY+294)) && (selectY <+ (panelY+300)) ) {adjustPrice('pricePL5',true);
                        } else if ( (selectY >= (panelY+301)) && (selectY <+ (panelY+307)) ) {adjustPrice('pricePL5',false);
                        } else if ( (selectY >= (panelY+349)) && (selectY <+ (panelY+355)) ) {adjustPrice('pricePL6',true);
                        } else if ( (selectY >= (panelY+356)) && (selectY <+ (panelY+362)) ) {adjustPrice('pricePL6',false);
                        }

                    }


                    // Reset flag, redraw map if applicable:
                    if (activeSquare == true) {
                        activeSquare = false;
                        context.fillStyle = "#d3d3d3";
                        context.fillRect(0, 0, 782, 680);
                        drawMap();
                    }

                } // End if within horizontal bounds of PL buttons


/***************************************
 * THEN MAP SELECTION SQUARE FUNCTIONS *
 ***************************************/

            // We are not inside the control panel.  Draw the square:
            } else {

                activeSquare = true; // Okay to draw the square now

                // Check if mouse clicked into a seat square, highlight that square if so:
                for (z=0; z<seatMapArray.length; z++) {

                    if ( ( (selectX > seatMapArray[z][0]) && (selectX < (seatMapArray[z][0] + 10) ) ) && ( (selectY > seatMapArray[z][1]) && selectY < (seatMapArray[z][1] + 10) ) ) {

                            edgeLeft = seatMapArray[z][0];
                            edgeTop = seatMapArray[z][1];
                            edgeRight = edgeLeft + 10;
                            edgeBottom = edgeTop + 10;
                            seatMapArray[z][4] = true;
                            area = ( (edgeRight-edgeLeft) * (edgeBottom-edgeTop) );
                            qtySelected++;
                            drawSquare(seatMapArray[z][0],seatMapArray[z][1],10,10);

                    } // end if

                } // end for

                // Check if mouse clicked into the standing section and react accordingly:
                if ( selectX <407 && selectX>107 && selectY<355 && selectY>305 ) {

                    standingClick=true;
                    drawSquare(selectX,selectY,0,0);

                }

              // While mouse button is down, listen for mouse move:
              document.addEventListener('mousemove', moved);

          } // end of else

      } // End of clicked


/*************************
 * DOUBLE CLICK FUNCTION *
 *************************/

      function double() {

          // If "drag panel" button is double clicked after panel was moved:
          if ( (selectX >= (panelX+210)) && (selectX <= (panelX+240)) && (selectY <= (panelY+40)) && (selectY >= (panelY+10)) ) {

              // reset control panel to original position:
              panelX = 517;
              panelY = 15;
              canvasOne.removeEventListener('mousedown', clicked);
              canvasOne.removeEventListener('dblclick', double);
              upped();

          } // end if

      } // end of double

      // Now click/doubleclick functions are built, listen:
      canvasOne.addEventListener('mousedown', clicked);
      canvasOne.addEventListener('dblclick', double);


/****************************************************
 * SCROLL FUNCTION TO ADJUST CONTROL PANEL POSITION *
 ****************************************************/

      function scrollFunction() {

          // Get reference to the top of the viewport (top.x)
          var elmnt = document.getElementById('canvasOne');
          var x = elmnt.getBoundingClientRect();

          // If viewport recedes beyond top and panel has not moved horizontally, go:
          if ( (panelX == 517) && (x.top < 0) ) {

              // Blank out canvas behind current box, it's about to move:
              context.fillStyle = '#d3d3d3';
              context.fillRect(0,0,782,680);

              // Adjust panelY to top of viewport (stop at margins):
              panelY = Math.abs(x.top);
              if (panelY <15) {panelY = 15;}
              if (panelY >220) {panelY = 220;}

              // Now redraw the map:
              drawMap();

          } // end if

      } // end scrollFunction

      window.addEventListener('scroll', scrollFunction);

   } // End drawScreen

// Now that all functions are loaded, start:
drawScreen();

} // End canvasApp

window.onload = canvasApp;
