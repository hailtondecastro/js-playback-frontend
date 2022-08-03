function main() {
    console.log('inicio');
    var arrayOla = ['ola', 'silvia', 'eu', 'sou', 'um', 'programa'];
    for (let index = 0; index < 1000000000000000; index++) {
        console.log('inicio');
        const itemStr = arrayOla[index];
        console.log(itemStr);    
    }
}

main();