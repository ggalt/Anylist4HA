# Anylist4HA
Integrate Anylist lists into Home Assistant based off of the wonderful work of Max Isom at: https://github.com/codetheweb/anylist

This is an attempt to create a means of pushing grocery items to a list on Anylist.  Currently, the list ("Test List") is hard-coded in the module.  You need to format a call to this module as:
`node anylist.js <username> <password> <command> <item>`

We assume commands come in in the form of:
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
  We assume the command is first, followed by a quantity or item, followed by an item (in possibly multiple words), followed by useless stuff e.g. "add 5 apples to the list", or "add apples".  
  Note that "delete" actually removes the item from the list.  "remove" is the same as "check off", simply indicating that the item has been checked off.
