/**
 * RULE: 匹配规则，正则表达式
 * BASE_PATH: 要查询的文件夹位置
 * OUTPUT：结果输出位置
 * delimiter: 分隔符
 */
module.exports = {
    RULE: /[\u4E00-\u9FA5]+/g,
    BASE_PATH: 'C:/Users/lanxin/Desktop/mycode/findstr/source',
    OUTPUT: 'C:/Users/lanxin/Desktop/mycode',
    delimiter: '·'
}