import {
    Enum,
    ExtEnum
} from './libs/EnumJS/ENUM.mjs'


/**
 * @constant { ExtEnum } CARDINAL
 * @constant { ExtEnum } DIAGONAL
 * Are extended enums holding the possible values for action
 * action points used to move in a cardinal or diagonal
 * direction respectively.
 */
const CARDINAL = new ExtEnum([{'CARDINAL':10}, {'DIAGONAL':14}])
const DIAGONAL = new ExtEnum([{'DIAGONAL':14}, {'CARDINAL':10}])

export class Grid {

    static CARDINAL = CARDINAL
    static DIAGONAL = DIAGONAL

    constructor(width, depth){
        /**
         * Field represents a grid of squares. Each square on the grid is a node 
         * with a path to each adjascent node. However, this implementation takes 
         * into account the length of the hypotnuse for diagonal movement.
         * @constructor 
         * @param { number } width is the size in the x-direction
         * @param { number } depth is the size in the y-direction
         */
        if( width < 1 || depth < 1){
            throw new RangeError('Width and Depth must be greater than 1.')
        }

        this.origin = new Node(0,0)
        this.linkEasterly(this.origin, width)
        this.linkNortherly(this.origin, width, depth)
        this.linkAll(this.origin)
    }

    linkEasterly(node, width, j=0){
        /**
         * @method linkEasterly links nodes from x=0 to x = width
         * @param { Node } node node is the node to start with
         * @param { number }  width width is the size parameter in the x-direction
         * @param { number }  j is the current y=value of the nodes in the y-direction
         *          inherited from the @method LinkNortherly method.
         */
        let currentNode = node
        let lastNode = null

        for( let i = 1; i < width ; i++ ){
            currentNode.setEA(new Node(i,j))
            lastNode = currentNode
            currentNode = currentNode.getEA()
            currentNode.setWE(lastNode)
        }
    }

    linkNortherly(node, width, depth){
        /**
         * @method linkNortherly
         * @param { Node } node is the node to start with
         * @param { number }  width is the size in x-direction; 
         *      this is needed to pass to @method linkEasterly
         * @param { number }  j is the size in the y-direction
         */
        let currentNode = node
        let lastNode = null
        for( let j = 1 ; j < depth ; j++ ){
            currentNode.setNO(new Node(0,j))
            lastNode = currentNode
            currentNode = currentNode.getNO()
            currentNode.setSO(lastNode)
            this.linkEasterly(currentNode, width, j)
        }
    }

    linkAll(start) {
        /**
         * @method linkAll
         *      connects the field of nodes together by every available path. 
         */
        this.linkXYPositive(start)
        this.linkYPositive(start)
        this.linkXYNegative(start)
        
        if( start.getNO() !== null ){
            this.linkAll(start.getNO())
        }

        if( start.getEA() !== null ){
            this.linkAll(start.getEA())
        }
    }

    linkXYPositive(start){
        if(start.getNO() !== null && start.getNO().getEA() !== null){
            start.setNE(start.getNO().getEA())
            start.getNO().getEA().setSW(start)
        }
    }

    linkYPositive(start){
        if(     start.getNO() !== null && 
                start.getNO().getEA() !== null && 
                start.getEA() !== null){
            start.getEA().setNO(start.getNO().getEA())
            start.getNO().getEA().setSO(start.getEA())
        }
    }

    linkXYNegative(start){
        if(start.getNO() !== null && start.getEA() !== null){
            start.getNO().setSE(start.getEA())
            start.getEA().setNW(start.getNO())
        }
    }

    getNode(positionX, positionY) {
        let currentNode = this.origin

        if((positionX > this.getWidth()-1 || positionX < 0) && (positionY > this.getDepth()-1 || positionY < 0)){
            throw new RangeError('Out Of Bounds: the selected position is not on the field.')
        }

        if(currentNode.getNO() !== null){
            for( let j = 0 ; j < positionY; j++ ){
                currentNode = currentNode.getNO()
            }
        }

        if(currentNode.getEA() !== null){
            for( let i = 0 ; i < positionX ; i++ ){
                currentNode = currentNode.getEA()
            }
        }

        return currentNode

    }

    getWidth(){
        let currentNode = this.origin
        let i = 1

        while( currentNode.getEA() !== null ){
            currentNode = currentNode.getEA()
            i++
        }
        
        return i
    }

    getDepth(){
        let currentNode = this.origin
        let j = 1

        while( currentNode.getNO() !== null ){
            currentNode = currentNode.getNO()
            j++
        }

        return j
        
    }

    findPath(pts, start, destination){
        /**
         * @method findPath is a recursive method that finds the most direct path
         * @param { number } pts is the number of action points the unit has
         * @param { Node } start is the node the path starts on
         * @param { Node } destination is the node the unit wants to move to
         * @returns { Node } the destination node for confirmation
         */
        const p2 = destination
        const p1 = start

        if(p2.getX() - p1.getX() !== 0 && p2.getY() - p1.getY() !== 0){
            this.tryDiagonal(pts, start, destination)
        } else if(p2.getX() - p1.getX() !== 0 && p2.getY() - p1.getY() !== 0) {
            this.tryCardinal(pts, start, destination)
        } else {
            return start
        }
    }

    tryDiagonal(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position

        if(this.goNE(pts, currentNode, destination)){

            pts = pts - DIAGONAL.v()
            this.findPath(pts, currentNode.getNE(), destination)

        } else if(this.goNW()){

            pts = pts - DIAGONAL.v()
            this.findPath(pts, currentNode.getSW(), destination)            

        } else if(this.goSW()){

            pts = pts - DIAGONAL.v()
            this.findPath(pts, currentNode.getNW(), destination)

        } else if(this.goSE()){

            pts = pts - DIAGONAL.v()
            this.findPath(pts, currentNode.getSE(), destination)

        } else {

            return

        }
    }

    tryCardinal(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position

        if( this.goNO(pts, currentNode, destination) ){

            currentNode = currentNode.getNO()
            pts = pts - CARDINAL.v()
            this.findPath(pts, currentNode, destination)

        } else if( this.goSO(pts, currentNode, destination) ){

            currentNode = currentNode.getSO()
            pts = pts - CARDINAL.v()
            this.findPath(pts, currentNode, destination)

        } else if( this.goEA(pts, currentNode, destination) ){

            currentNode = currentNode.getEA()
            pts = pts - CARDINAL.v()
            this.findPath(pts, currentNode, destination)

        } else if( this.goWE(pts, currentNode, destination) ){

            currentNode = currentNode.getWE()
            pts = pts - CARDINAL.v()
            this.findPath(pts, currentNode, destination)

        } else {

            return

        }

    }

    static pathIsAvailable(start, pathEnum){
        const target = start.path[pathEnum.v()].node
        if(     target !== null &&
                target.getCover() === 0){
            return true
        } else {
            return false
        }
    }

    goNO(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Node.no) &&
            pts - CARDINAL.v() >= 0

        return valid
    }

    goSO(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Node.so) &&
            pts - CARDINAL.v() >= 0 
        
        return valid
    }

    goEA(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Node.ea) &&
            pts - CARDINAL.v() >= 0 
        
        return valid
    }

    goWE(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Grid.we) &&
            pts - CARDINAL.v() >= 0 
        
        return valid
    }

    goNE(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Node.ne) &&
            pts - DIAGONAL.v() >= 0 
        
        return valid
    }

    goNW(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x < 0 && 
            p2.y - p1.y > 0 &&
            this.pathIsAvailable(currentNode, Node.nw) &&
            pts - DIAGONAL.v() >= 0 
        
        return valid
    }

    goSW(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x < 0 && 
            p2.y - p1.y < 0 &&
            this.pathIsAvailable(currentNode, Node.sw) &&
            pts - DIAGONAL.v() >= 0 
        
        return valid
    }
    
    goSE(pts, currentNode, destination){
        const p2 = destination.position
        const p1 = currentNode.position
        const valid = 
            p2.x - p1.x > 0 && 
            p2.y - p1.y < 0 &&
            this.pathIsAvailable(currentNode, Node.se) &&
            pts - DIAGONAL.v() >= 0 
        
        return valid
    }

    coverBlocks(node1, node2, mod=0){
        return node2.getZ() - node1.getZ() < 2 + mod
    }

}

export class Node {

    static CARDINAL = CARDINAL
    static DIAGONAL = DIAGONAL

    constructor( x=null, y=null, z=0, cover='ZERO' ){
        /**
         * Node represents a node on a grid of squares. Each square on the grid 
         * has a path to each adjascent node. However, this implementation takes into
         * account the length of the hypotnuse for diagonal movement.
         * @constructor 
         * @param { number } posX represents the location of the node in the x-direction
         * @param { number } posY represents the location of the node in the y-direction
         * @param { number } posZ represents the height of the square
         * @property { Enum } cover
         *      @todo finish this implementation
         *      Cover is a modifier on toHit chance units get as a bonus
         */

        this.path = { 
            ea: {
                alias: 'path east',
                node: null,
                pathType: CARDINAL
            },
            no: {
                alias: 'path north',
                node: null,
                pathType: CARDINAL
            },
            we: {
                alias: 'path west',
                node: null,
                pathType: CARDINAL
            },
            so: {
                alias: 'path south',
                node: null,
                pathType: CARDINAL
            },
            ne: {
                alias: 'path north east',
                node: null,
                pathType: DIAGONAL
            },
            nw: {
                alias: 'path north west',
                node: null,
                pathType: DIAGONAL
            },
            sw: {
                alias: 'path south west',
                node: null,
                pathType: DIAGONAL
            },
            se: {
                alias: 'path south east',
                node: null,
                pathType: DIAGONAL
            }
        }

        this.index = {
            x: x,
            y: y,
            z: z
        }

        this.cover = new Enum(['ZERO','HALF','WHOLE'])
    }

    setCover( cover ){
        if( typeof cover === 'string'){
            this.cover.select(cover)
        } else if( cover === 0 ){
            this.cover.select('ZERO')
        } else if( cover === 1 ){
            this.cover.select('ONE')
        } else if( cover === 2 ){
            this.cover.select('WHOLE')
        } else {
            throw new TypeError('Invalid setCover(arg) argument.')
        }
    }

    getCover(){
        if( this.cover.valueOf() === 'ZERO' ){
            return 0
        } else if( this.cover.valueOf() === 'HALF' ){
            return 1
        } else if( this.cover.valueOf() === 'WHOLE' ){
            return 2
        } else {
            throw new RangeError(`Cover's value is out of range`)
        }
    }

    locationToString(){
        if(this.getX() === null || this.getY() === null){
            return 'node without indices'
        } else {
            return `node@(${this.getX()},${this.getY()})`
        }
    }

    getPaths(){
        return Object.values(this.path)
    }

    getIndex(){
        return this.index
    }

    getPathEA(){
        return this.path.ea
    }
    
    getPathNE(){
        return this.path.ne
    }

    getPathNO(){
        return this.path.no
    }

    getPathNW(){
        return this.path.nw
    }

    getPathWE(){
        return this.path.we
    }

    getPathSW(){
        return this.path.sw
    }

    getPathSO(){
        return this.path.so
    }

    getPathSE(){
        return this.path.se
    }

    getEA(){
        return this.path.ea.node
    }

    setEA(node){
        this.getPathEA().node = node
    }

    getNE(){
        return this.path.ne.node
    }

    setNE(node){
        this.path.ne.node = node
    }

    getNO(){
        return this.path.no.node
    }

    setNO(node){
        this.path.no.node = node
    }

    getNW(){
        return this.path.nw.node
    }

    setNW(node){
        this.path.nw.node = node
    }

    getWE(){
        return this.path.we.node
    }

    setWE(node){
        this.path.we.node = node
    }

    getSW(){
        return this.path.sw.node
    }

    setSW(node){
        this.path.sw.node = node
    }

    getSO(){
        return this.path.so.node
    }

    setSO(node){
        this.path.so.node = node
    }

    getSE(){
        return this.path.se.node
    }

    setSE(node){
        this.path.se.node = node
    }

    getX(){
        return this.index.x
    }

    setX(posX){
        this.index.x = posX
    }

    getY(){
        return this.index.y
    }

    setY(posY){
        this.index.x = posY
    }

    getZ(){
        return this.index.z
    }

    setZ(posZ){
        this.index.x = posZ
    }

    toString(){
        return `(${JSON.stringify(this.valueOf())})`
    }

    matches(node){
        const result = 
            this.getX() === node.getX() &&
            this.getY() === node.getY() &&
            this.getZ() === node.getZ() &&
            this.getCover().valueOf() === node.getCover().valueOf()

        return result
    }

    v(){
        /**
         * @method v is short for valueOf
         */
        return this.valueOf()
    }

    valueOf(){
        /**
         * @method valueOf
         * @returns { Object } an object with the position and cover of the node
         * @summary returns an object that allows for the comparison of nodes
         */
        return {
            position: this.getIndex(),
            cover: this.cover.valueOf()
        }
    }
}
