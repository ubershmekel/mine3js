mine3js
=======

[Playable live demo](http://ubershmekel.github.io/mine3js/).

Implemented
-------

* Dirt cube state in URL, here's an [alien example](http://ubershmekel.github.io/mine3js/#a=LmTaLnfaLnvaLozaLnfbLnvbLozbLnfcLnvcLozcLp1cLp5cLp9cLmTdLnfdLnvdLozdLp9dLpDdLpHdLpLdLmXeLmTeLnfeLnzeLozeLpLeLpPeLpTeLmbfLmXfLmTfLnffLnzfLoPfLoTfLozfLpTfLmfgLmbgLmTgLnjgLnzgLo1gLoLgLoPgLoTgLoXgLovgLozgLpPgLmnhLmjhLmfhLmThLnjhLo1hLoLhLoPhLoThLoXhLovhLpPhLmjiLmTiLmriLmviLnjiLoPiLoTiLoviLpPiLmjjLmTjLmvjLnTjLnXjLnbjLnfjLnjjLnnjLmzjLn1jLorjLovjLn5jLpLjLpPjLn9jLnDjLnHjLnLjLnPjLmjkLmTkLnfkLnnkLnrkLmzkLorkLpLkLmflLmTlLnblLnrlLn1lLonlLorlLpDlLpHlLpLlLpPlLmbmLmXmLmTmLnTmLnXmLnrmLnvmLonmLp9mLpDmLn5mLpPmLpTmLn9mLnvnLnznLojnLonnLp9nLpTnLpXnLnDnLnHnLnLnLnPnLnzoLo1oLofoLojoLonoLoroLp9oLpToLpXoLo1pLo5pLobpLofpLorpLp9pLpDpLpTpLo5qLo9qLoDqLoTqLoXqLobqLonqLorqLpDqLpHqLpLqLpPqLpTqLoDrLoHrLoLrLoPrLoTrLonrLoTsLoXsLobsLofsLojsLoTLLoXLLobLLofLLojLLoDMLoHMLoLMLoPMLoTMLonMLo5NLo9NLoDNLoTNLoXNLobNLonNLorNLo1OLo5OLobOLofOLorOLnzPLo1PLofPLojPLonPLorPLnvQLnzQLojQLonQLnDQLnHQLnLQLnPQLmbRLmXRLmTRLnTRLnXRLnrRLnvRLonRLn5RLn9RLmfSLmTSLnbSLnrSLn1SLonSLorSLmjTLmTTLnfTLnnTLnrTLmzTLorTLmjULmTULmvULnTULnXULnbULnfULnjULnnULmzULn1ULorULovULn5ULn9ULnDULnHULnLULnPULmjVLmTVLmrVLmvVLnjVLoPVLoTVLovVLmnWLmjWLmfWLmTWLnjWLo1WLoLWLoPWLoTWLoXWLovWLmfXLmbXLmTXLnjXLnzXLo1XLoLXLoPXLoTXLoXXLovXLozXLmbYLmXYLmTYLnfYLnzYLoPYLoTYLozYLmXZLmTZLnfZLnzZLozZLmTcLmTb)
* Pointer Lock mouselook
* Jumping
* Gravity
* Make a cube
* Destroy a cube
* Collisions

Cube encoding
-------
Right now blocks can be placed in 256x256x256 locations via 3 unsigned bytes
encoded with 4 64based (6bit) letters. For a 2000 character url you can get 500
blocks which isn't too bad IMO. I'm open to ideas for a better scheme.

Credits
-------
A [three.js](http://threejs.org) [minecraft](http://www.minecraft.net) demo

based on the [ao demo](http://mrdoob.github.com/three.js/examples/webgl_geometry_minecraft_ao.html)

with the [painterly pack](http://painterlypack.net) textures.

Url's encoded with [JS Base64](http://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript).

Cube icon favicon - Keyamoon - http://keyamoon.com/
