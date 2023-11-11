if(process.argv.length < 3) {
  console.log("Need to pass at least 4 arguments: username, password, command, item");
  return;
}

let args = process.argv.slice(2);
let myUsername = args[0];
let myPassword = args[1];
let cmdLine = args.slice(2);

// console.log(args);
// console.log("command:", cmdLine);

const AnyList = require('anylist');

const any = new AnyList({email: myUsername, password: myPassword });

any.on('lists-update', lists => {
  console.log('Lists were updated!');
});

any.login().then(async () => {
  await any.getLists();

  // listAllLists(any);

  const testList = any.getListByName('Test List');  //NOTE: Change to the list you want to use.  

  let result = await processCommands( cmdLine, testList);

  console.log("Final Result:", result);
  listAllItems(testList);

  any.teardown();   // MUST CALL to exit
});

async function addNewItem( listname, myItem ) {
  let checkItem = await listname.getItemByName(myItem);

  if( checkItem === undefined ) {   // didn't find the item already in the list (checked or unchecked)
    console.log("new item added:", myItem);
    let addedItem = any.createItem( { name: myItem } );
    addedItem = await listname.addItem( addedItem);
    addedItem.checked = false;
    await addedItem.save();

  } else if( checkItem.checked === true ){
      checkItem.checked = false;
    await checkItem.save();
  }
  return myItem + " added";
}

async function addQuantity( listname, myItem, myAmount ) {
  let checkItem = await listname.getItemByName(myItem);

  if( checkItem === undefined ) {   // didn't find the item already in the list (checked or unchecked)
    console.log("new item added:", myItem);
    let addedItem = any.createItem( { name: myItem } );
    addedItem = await listname.addItem( addedItem);
    addedItem.checked = false;
    addedItem.quantity = myAmount;
    await addedItem.save();

  } else if( checkItem.checked === true ){
      checkItem.checked = false;
      checkItem.quantity = myAmount;
    await checkItem.save();
  }
  return myItem + " added";
}

async function findTheItem( listname, myItem ) {
  let checkItem = await listname.getItemByName(myItem);

  if( checkItem === undefined ) {   // didn't find the item already in the list (checked or unchecked)
    return myItem + " is not on the list";
  } else if( checkItem.checked === true ){
    return myItem + " is checked off on the list";
  }
  return myItem + " is on the list";
}

async function deleteItem( listname, myItem ) {
  let checkItem = await listname.getItemByName(myItem);

  if( checkItem === undefined ) {
    return "Could not remove " + myItem + " because it is not in list";
  }

  await listname.removeItem( checkItem );
  return myItem + " deleted";
}

async function removeMyItem( listname, myItem ) {
  let checkItem = await listname.getItemByName(myItem)

  if( checkItem === undefined ) {
    return "Could not remove " + myItem + " because it is not in list";
  }

  checkItem.checked = true;
  await checkItem.save();

  return myItem + " checked off";
}

async function listAllLists( myAny ) {
  let listOfLists = await myAny.getLists();

  listOfLists.forEach( lst => {
    console.log( "List:", lst.name);
  });
  return listOfLists;
}

async function listUncheckedItems( listname ) {
  let unCheckedList = [];

  listname.items.forEach(itm => {
    if( itm.checked !== true )  {
      unCheckedList.push(itm);
      console.log("Item:", itm.name, itm.checked);
    }
  });
  
  return unCheckedList;
}

async function listAllItems( listname ) {
  listname.items.forEach(itm => {
    console.log("Item:", itm.name, itm.checked);
  });
  return listname.items;
}

async function processCommands( cmdList, myList ) {
  /* we assume commands come in in the form of:
  'command', 'item'  or 'command', 'amount', 'item'
  acceptable commands are:
    read
    add
    delete
    remove
    check if
    check off
    check
    is
    are
  process command, item and quantiy.  
  We assume the command is first, followed by a quantity or item, followed by an item (in possibly multiple words), followed by useless stuff
  e.g. "add 5 apples to the list", or "add apples"
  */

  // first check that we have the initial command
  let instructionStr = cmdList.toString().replaceAll(",", " ");
  // console.log("instructionString is:", instructionStr);
  let cmdRegEx = /(read|add|delete|remove|check|is|are)/i;
  let cmdString = instructionStr.match(cmdRegEx)[0];
  if( cmdString === "check" ) {
    let nextWord = instructionStr.split(" ")[1];
    if( nextWord === "if" || nextWord == "off") {
      cmdString = cmdString+" "+nextWord;
    }
  }
  cmdString = cmdString.trim();
  console.log("cmdString:", cmdString);

  let numRegEx =  /\d+/;
  let hasQuantity = false;
  let itemQuantity = "";
  if( numRegEx.test(instructionStr) ) {
    hasQuantity = true;
    itemQuantity = instructionStr.match(numRegEx)[0].trim();
  }

  let itemStr = instructionStr.substring( instructionStr.indexOf(cmdString)+cmdString.length+1 );
  let remainGarbageRegEx = /(on|in|for|to|from|is on|are on) * (list|grocery list|shopping list)/i;
 
  if( remainGarbageRegEx.test(instructionStr) ) {
    itemStr = instructionStr.substring( 
      instructionStr.indexOf(cmdString)+cmdString.length+1, 
      instructionStr.search(remainGarbageRegEx));
  }
  if(hasQuantity) {
    itemStr = itemStr.substring(itemQuantity.length).trim();
  }
  console.log("itemStr:", itemStr);
  itemStr = itemStr.trim();

  // console.log("Full instruction:", instructionStr);
  // console.log("command:", cmdString);
  // console.log("Item:", itemStr);
  // console.log("Quantity:", itemQuantity);

  if( cmdString === "read") { // read off items on list
    return await listUncheckedItems(myList);

  } else
  if ( cmdString === "add") { // add item
    if( hasQuantity ) {
      return await addQuantity(myList, itemStr, itemQuantity);
    }
    return await addNewItem(myList, itemStr);

  } else
  if ( cmdString === "delete") {  // delete item from list (not just "check off")
    return await deleteItem(myList, itemStr);

  } else
  if ( cmdString === "remove" || cmdString === "check off" ) {  // check item off so it is hidden (or struck throug), but not removed 
    return await removeMyItem(myList, itemStr);

  } else
  if ( cmdString === "check if" ||
       cmdString === "check" ||
       cmdString === "is" ||
       cmdString === "are" ) {    // check to see if something is on the list
    return await findTheItem(myList, itemStr);

  } else { // fail!
    return "I don't know the command " + instructionStr;
  }
}
