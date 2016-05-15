
// 在这里新增你的测试用例

describe('测试用例', function() {
	var S = KISSY;
	S.config({
		packages:[{
			name:'proj',
			path:'../'
		}]
	});
	// 在这里添加你的测试用例
	it('测试用例A', function(done) {
		S.use('proj/index',function(S,Index){
			Index.init();
			S.one('#log').text().should.be.eql('ok');
			done();
		});
	});
});
