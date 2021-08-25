import './css/global.css';
import './css/styles.css';

import {findGridItem, orderGridItems, findLargestGridRow} from './Services/findGridItem';

//GLOBAL
let pos = {x: null, y: null}; //Mouse coordinates
let diff = {x: null, y: null}; //So that mouse can drag item on the correct spot
let mouseDown = false; //Needs to be true for logic in 'mouseMove' event listener to be activated
let selectedItem = null; //Allows clicked on item to be tracked in 'mouseMove' event listener
let transitionTime = 400; //In milliseconds
const gridEle = document.querySelector('.grid');
let switchCooldown = false; //Cooldown to prevent swaps from getting broken
let mouseSpeed = 0; //Used to dynamically calculate the switchCooldown
let resetTransition = false; //Overall cooldown to not mess things up when grid is being re-created

//RESPONSIVE DESIGN
let windowWidth = window.innerWidth;

//GRID INFORMATION
let numGridCols = 4;
let gridItemWidth = 25; //In percentages
let gridItemHeight = 300; //In pixels
function sortInitialPosition(){
    if(windowWidth < 769){
        numGridCols = 1;
        gridItemWidth = 100;
        return;
    }
    if(windowWidth < 993){
        numGridCols = 2;
        gridItemWidth = 50;
        return;
    }
    if(windowWidth < 1201){
        numGridCols = 3;
        gridItemWidth = 33.33333;
    }
}
sortInitialPosition();

function positionItems(beforeRowCol = {row: null, col: null}, newRowCol = {row: null, col: null}){
    let rowNum = 0;
    let colNum = 0;
    let gridItems = document.querySelectorAll('.grid-container .grid-item'); gridItems = Array.prototype.slice.call(gridItems); gridItems = gridItems.filter(gridItem => gridItem.getAttribute('selected') !== 'yes');
    if(beforeRowCol.row){
        switchCooldown = true;
        let delay = 200 - (mouseSpeed * 100), timeout = 200;
        if(delay < -4000) timeout = 50;
        setTimeout(() => {
            switchCooldown = false;
        }, timeout);
        gridItems = orderGridItems(gridItems);
    }
    gridItems.forEach(gridItem => {
        if(newRowCol.col === colNum + 1 && newRowCol.row === rowNum + 1){ //Need to skip a number because an item has had to be moved out of the way and into a spot that we need to now skip over in order to retain the order of the grid.
            colNum++;
            if(colNum % numGridCols === 0){ //Extra increment MAY need a row increment as well.
                rowNum++;
                colNum = 0;
            }
        }

        if(beforeRowCol.col === colNum + 1 && beforeRowCol.row === rowNum + 1){ //Reposition the item that the selected item is moving in to replace
            gridItem.style.left = `${(newRowCol.col - 1) * gridItemWidth}%`;
            gridItem.setAttribute('col', newRowCol.col);
            gridItem.style.top = `${(newRowCol.row - 1) * gridItemHeight}px`;
            gridItem.setAttribute('row', newRowCol.row);
            gridItem.style.zIndex = '500';
        }else{ //Else. Position the item as normal in order.
            gridItem.style.left = `${colNum * gridItemWidth}%`;
            gridItem.setAttribute('col', colNum + 1);
            gridItem.style.top = `${rowNum * gridItemHeight}px`;
            gridItem.setAttribute('row', rowNum + 1);
            gridItem.style.zIndex = '';
        }

        colNum++; //Increment as normal.
        if(colNum % numGridCols === 0){
            rowNum++;
            colNum = 0;
        }
    });
}
//POSITION ON DOCUMENT LOAD
positionItems();
//Set height on initial page load
let gridRows = Math.ceil(document.querySelectorAll('.grid-container .grid-item').length / numGridCols);
gridEle.style.height = `${gridRows * gridItemHeight}px`;

function positionItemsInOrder(){ //Grid can properly re-order itself when mouse is released
    let rowNum = 0;
    let colNum = 0;
    let gridItems = document.querySelectorAll('.grid-container .grid-item'); gridItems = Array.prototype.slice.call(gridItems); gridItems = orderGridItems(gridItems);
    gridItems.forEach((gridItem, index) => {
        if(gridItem.getAttribute('selected') === 'yes'){
            gridItem.removeAttribute('selected');
            setTimeout(() => {gridItem.style.zIndex = '';}, transitionTime);
        }
        
        gridItem.style.left = `${colNum * gridItemWidth}%`;
        gridItem.setAttribute('col', colNum + 1);
        gridItem.style.top = `${rowNum * gridItemHeight}px`;
        gridItem.setAttribute('row', rowNum + 1);

        colNum++;
        if(colNum % numGridCols === 0){
            rowNum++;
            colNum = 0;
        }
    });
    resetTransition = true; //Wait for grid re-creation to finish
    //Re-create grid when transition is over
    setTimeout(() => {
        while(gridEle.firstChild){
            gridEle.removeChild(gridEle.lastChild);
        };
        gridItems.forEach(gridItem => {
            gridEle.append(gridItem);
        });
        resetTransition = false;
    }, transitionTime);
}

document.querySelectorAll('.grid-container .grid-item').forEach((gridItem, index) => {
    gridItem.addEventListener('mousedown', e => {
        e.preventDefault();
        if(!pos.x || resetTransition) return;
        mouseDown = true, selectedItem = gridItem;
        diff.y = pos.y - gridItem.offsetTop, diff.x = pos.x - gridItem.offsetLeft;
        let offsetY = pos.y - diff.y, offsetX = pos.x - diff.x;
        gridItem.style.top = offsetY + 'px';
        gridItem.style.left = offsetX  + 'px';
        gridItem.style.zIndex = '1000';
        gridItem.setAttribute('selected', 'yes');
    });
    gridItem.addEventListener('mouseup', e => {
        mouseDown = false;
        positionItemsInOrder();
    });
});

addEventListener('mousemove', e => {
    if(pos.x){ //Used for the switch cooldown.
        let xDiff = Math.abs((e.clientX - gridEle.offsetLeft) - pos.x), yDiff = Math.abs((e.clientY - (gridEle.offsetTop - window.scrollY)) - pos.y);
        if(xDiff > yDiff) mouseSpeed = xDiff;
        else mouseSpeed = yDiff;
    }
    pos.x = e.clientX - gridEle.offsetLeft, pos.y = e.clientY - (gridEle.offsetTop - window.scrollY);
    if(!mouseDown) return;
    let offsetY = pos.y - diff.y, offsetX = pos.x - diff.x;
    selectedItem.style.top = offsetY + 'px';
    selectedItem.style.left = offsetX + 'px';
    if(switchCooldown) return;
    let selectedRow = Number(selectedItem.getAttribute('row')), selectedCol = Number(selectedItem.getAttribute('col'));
    let gridItems = document.querySelectorAll('.grid-container .grid-item'); gridItems = Array.prototype.slice.call(gridItems); gridItems = gridItems.filter(gridItem => gridItem.getAttribute('selected') !== 'yes');
    //UPPER ROW
    if(selectedRow > 1){
        let straightUpItem = findGridItem(gridItems, selectedRow - 1, selectedCol);
        if((pos.x > straightUpItem.item.offsetLeft && pos.x < straightUpItem.item.offsetLeft + straightUpItem.item.clientWidth) &&
        (pos.y < straightUpItem.item.offsetTop + (straightUpItem.item.clientHeight / 1.25))){
            positionItems({row: straightUpItem.row, col: straightUpItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow - 1);
            return;
        }
        let upRightItem = findGridItem(gridItems, selectedRow - 1, selectedCol + 1);
        if(upRightItem.item && (pos.x > upRightItem.item.offsetLeft && pos.x < upRightItem.item.offsetLeft + upRightItem.item.clientWidth) &&
        (pos.y < upRightItem.item.offsetTop + (upRightItem.item.clientHeight / 1.25))){
            positionItems({row: upRightItem.row, col: upRightItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow - 1);
            selectedItem.setAttribute('col', selectedCol + 1);
            return;
        }
        let upLeftItem = findGridItem(gridItems, selectedRow - 1, selectedCol - 1);
        if(upLeftItem.item && (pos.x > upLeftItem.item.offsetLeft && pos.x < upLeftItem.item.offsetLeft + upLeftItem.item.clientWidth) &&
        (pos.y < upLeftItem.item.offsetTop + (upLeftItem.item.clientHeight / 1.25))){
            positionItems({row: upLeftItem.row, col: upLeftItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow - 1);
            selectedItem.setAttribute('col', selectedCol - 1);
            return;
        }
    }
    //SAME ROW
    let straightRightItem = findGridItem(gridItems, selectedRow, selectedCol + 1);
    if(straightRightItem.item && (pos.y > straightRightItem.item.offsetTop && pos.y < straightRightItem.item.offsetTop + straightRightItem.item.clientHeight) &&
        (pos.x > straightRightItem.item.offsetLeft + (straightRightItem.item.clientWidth / 4))){
            positionItems({row: straightRightItem.row, col: straightRightItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow);
            selectedItem.setAttribute('col', selectedCol + 1);
            return;
        }
    let straightLeftItem = findGridItem(gridItems, selectedRow, selectedCol - 1);
    if(straightLeftItem.item && (pos.y > straightLeftItem.item.offsetTop && pos.y < straightLeftItem.item.offsetTop + straightLeftItem.item.clientHeight) &&
        (pos.x < straightLeftItem.item.offsetLeft + (straightLeftItem.item.clientWidth / 1.25) )){
            positionItems({row: straightLeftItem.row, col: straightLeftItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow);
            selectedItem.setAttribute('col', selectedCol - 1);
            return;
        }
    //BOTTOM ROW
    if(selectedRow < gridRows){
        let straightBottomItem = findGridItem(gridItems, selectedRow + 1, selectedCol);
        if((pos.x > straightBottomItem.item.offsetLeft && pos.x < straightBottomItem.item.offsetLeft + straightBottomItem.item.clientWidth) &&
        (pos.y > straightBottomItem.item.offsetTop + (straightBottomItem.item.clientHeight / 4))){
            positionItems({row: straightBottomItem.row, col: straightBottomItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow + 1);
            return;
        }
    }
    let bottomRightItem = findGridItem(gridItems, selectedRow + 1, selectedCol + 1);
        if(bottomRightItem.item && (pos.x > bottomRightItem.item.offsetLeft && pos.x < bottomRightItem.item.offsetLeft + bottomRightItem.item.clientWidth) &&
        (pos.y > bottomRightItem.item.offsetTop + (bottomRightItem.item.clientHeight / 4))){
            positionItems({row: bottomRightItem.row, col: bottomRightItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow + 1);
            selectedItem.setAttribute('col', selectedCol + 1);
            return;
        }
    let bottomLeftItem = findGridItem(gridItems, selectedRow + 1, selectedCol - 1);
        if(bottomLeftItem.item && (pos.x > bottomLeftItem.item.offsetLeft && pos.x < bottomLeftItem.item.offsetLeft + bottomLeftItem.item.clientWidth) &&
        (pos.y > bottomLeftItem.item.offsetTop + (bottomLeftItem.item.clientHeight / 4))){
            positionItems({row: bottomLeftItem.row, col: bottomLeftItem.col}, {row: selectedRow, col: selectedCol});
            selectedItem.setAttribute('row', selectedRow + 1);
            selectedItem.setAttribute('col', selectedCol - 1);
            return;
        }
});

function newPosition(){ //Reused code that needs to be called everytime we reposition the grid based on a new media query being met.
    let gridItems = document.querySelectorAll('.grid-container .grid-item'); 
    gridItems.forEach(gridItem => {gridItem.style.transition = 'none'});
    positionItems();
    let gridRows = Math.ceil(document.querySelectorAll('.grid-container .grid-item').length / numGridCols);
    gridEle.style.height = `${gridRows * gridItemHeight}px`;
    setTimeout(() => {gridItems.forEach(gridItem => {gridItem.style.transition = ''});}, 10);
}

//RESPONSIVE DESIGN
addEventListener('resize', e => {
    windowWidth = window.innerWidth;
    if(windowWidth > 1200){
        numGridCols = 4;
        gridItemWidth = 25;
        newPosition();
        return;
    }
    if(windowWidth < 769){
        numGridCols = 1;
        gridItemWidth = 100;
        newPosition();
        return;
    }
    if(windowWidth < 993){
        numGridCols = 2;
        gridItemWidth = 50;
        newPosition();
        return;
    }
    if(windowWidth < 1201){
        numGridCols = 3;
        gridItemWidth = 33.33333;
        newPosition();
    }

});