export function findGridItem(gridItems, row, col){
    let item = gridItems.find(gridItem => Number(gridItem.getAttribute('row')) === row && Number(gridItem.getAttribute('col')) === col);
    return {
        item,
        row: item ? Number(item.getAttribute('row')) : null,
        col: item ? Number(item.getAttribute('col')) : null
    }
}

export function orderGridItems(gridItems){
    let newGridItems = gridItems.sort((a, b) => {
        return Number(a.getAttribute('row')) > Number(b.getAttribute('row')) ? 1 : Number(a.getAttribute('row')) === Number(b.getAttribute('row'))
        ? (Number(a.getAttribute('col')) > Number(b.getAttribute('col')) ? 1 : -1) : -1;
    });
    return newGridItems;
}

export function findLastGridItem(gridItems, keepRow, modifier = 0){
    let orderedGridItems = orderGridItems(gridItems); orderedGridItems.filter(item => Number(item.getAttribute('row')) === keepRow);
    let lastGridItem = orderedGridItems[orderedGridItems.length - 1 - modifier];
    let row = Number(lastGridItem.getAttribute('row')), col = Number(lastGridItem.getAttribute('col'));
    return{
        item: lastGridItem,
        row,
        col
    }
}