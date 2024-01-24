import {
    MpComponent,
    MpComponentMixin,
    MpPage,
    MpPageMixin,
    MpViewMixin,
    toMpComponentConfig,
    toMpPageConfig
} from '../src/index';
import { assert } from 'chai';

describe('typescript-mp-component', () => {
    it('single prototype and no mixins', () => {
        class P1 extends MpPage {
            data = { name: 'tom' };
            f1() {
                return 1;
            }
            f2() {
                return this.data.name;
            }
        }

        const p = toMpPageConfig(P1);
        assert.equal(Object.keys(p.data).length, 1);
        assert.equal(p.data.name, 'tom');
        assert.equal('f1' in p, true);
        assert.equal(p.f1(), 1);
        assert.equal(p.f2(), 'tom');
        assert.equal(p.f2.call({ data: { name: 'abc' } }), 'abc');

        class C1 extends MpComponent {
            initData = { name: 'alice' };
            f1() {
                return 2;
            }
            f2() {
                return this.data.name;
            }
        }

        const c = toMpComponentConfig(C1);
        assert.equal(Object.keys(c.data).length, 1);
        assert.equal(c.data.name, 'alice');
        assert.equal('f1' in c, false);
        assert.equal('f1' in c.methods, true);
        assert.equal(c.methods.f1(), 2);
        assert.throw(() => c.methods.f2(), /undefined/);
        assert.equal(c.methods.f2.call({ data: { name: 'abc' } }), 'abc');
    });

    it('extends class but no mixins', () => {
        const ps = { f1: 0 };
        class P1 extends MpPage {
            data = { name: 'tom' };
            f1() {
                ps.f1++;
                return 1;
            }
        }
        class P2 extends P1 {
            data = { name: 'p2', age: 20 };
            f1() {
                ps.f1++;
                return super.f1();
            }
            f2() {
                return this.data.name;
            }
        }
        const p = toMpPageConfig(P2);
        assert.equal(Object.keys(p.data).length, 2);
        assert.equal(p.data.name, 'p2');
        assert.equal(p.data.age, 20);
        assert.equal('f1' in p, true);
        assert.equal(p.f1(), 1);
        assert.equal(ps.f1, 2);
        assert.equal(p.f2(), 'p2');
        assert.equal(p.f2.call({ data: { name: 'abc' } }), 'abc');

        const cs = { f1: 0 };
        class C1 extends MpComponent {
            initData = { name: 'alice' };
            f1() {
                cs.f1++;
                return 2;
            }
        }
        class C2 extends C1 {
            initData = { name: 'C2', age: 30 };
            f1() {
                cs.f1++;
                return super.f1();
            }
            f2() {
                return this.data.name;
            }
        }

        const c = toMpComponentConfig(C2);
        assert.equal(Object.keys(c.data).length, 2);
        assert.equal(c.data.name, 'C2');
        assert.equal(c.data.age, 30);
        assert.equal('f1' in c, false);
        assert.equal('f1' in c.methods, true);
        assert.equal(c.methods.f1(), 2);
        assert.equal(cs.f1, 2);
        assert.throw(() => c.methods.f2(), /undefined/);
        assert.equal(c.methods.f2.call({ data: { name: 'abc' } }), 'abc');
    });

    it('single mixin', () => {
        class M1 extends MpViewMixin {
            x1: number;
            data = { name: 'm1', id: 'm1' };
            m1F1() {
                this.x1 = this.x1 || 0;
                this.x1++;
            }
            m1F2() {
                return this.x1;
            }
        }

        class P1 extends MpPage {
            $mx = {
                m1: new M1()
            };
            data = { name: 'tom' };
            f1() {
                return 1;
            }
            f2() {
                return this.data.name;
            }
        }

        const p = toMpPageConfig(P1);
        assert.equal(Object.keys(p.data).length, 2);
        assert.equal(p.data.name, 'tom');
        assert.equal(p.data.id, 'm1');
        assert.equal('f1' in p, true);
        assert.equal(p.f1(), 1);
        assert.equal(p.f2(), 'tom');
        assert.equal(p.f2.call({ data: { name: 'abc' } }), 'abc');
        assert.equal('m1F1' in p, true);
        assert.isUndefined(p.m1F1());
        assert.equal(p.m1F2(), 1);

        class C1 extends MpComponent {
            $mx = {
                m1: new M1()
            };
            initData = { name: 'alice' };
            f1() {
                return 2;
            }
            f2() {
                return this.data.name;
            }
        }

        const c = toMpComponentConfig(C1);
        assert.equal(Object.keys(c.data).length, 2);
        assert.equal(c.data.name, 'alice');
        assert.equal(c.data.id, 'm1');
        assert.equal('f1' in c, false);
        assert.equal('f1' in c.methods, true);
        assert.equal(c.methods.f1(), 2);
        assert.throw(() => c.methods.f2(), /undefined/);
        assert.equal(c.methods.f2.call({ data: { name: 'abc' } }), 'abc');

        assert.equal('m1F1' in c, false);
        assert.equal('m1F1' in c.methods, true);
        assert.isUndefined(c.methods.m1F1());
        assert.equal(c.methods.m1F2(), 1);
    });

    it('more mixin', () => {
        class M1 extends MpViewMixin {
            x1: number;
            data = { name: 'm1', id: 'm1' };
            m1F1() {
                this.x1 = this.x1 || 0;
                this.x1++;
            }
            m1F2() {
                return this.x1;
            }
        }
        class M2 extends MpViewMixin {
            x2: number;
            data = { name: 'm2', id: 'm2' };
            m2F1() {
                this.x2 = this.x2 || 2;
                this.x2++;
            }
            m2F2() {
                return this.x2;
            }
        }

        class M3 extends MpPageMixin {
            m3F1() {
                return 3;
            }
        }
        class M4 extends MpComponentMixin {
            m4F1() {
                return 4;
            }
        }

        class P1 extends MpPage {
            $mx = {
                m1: new M1(),
                m2: new M2(),
                m3: new M3()
            };
            data = { name: 'tom' };
            f1() {
                return 1;
            }
            f2() {
                return this.data.name;
            }
        }

        const p = toMpPageConfig(P1);
        assert.equal(Object.keys(p.data).length, 2);
        assert.equal(p.data.name, 'tom');
        assert.equal(p.data.id, 'm2');
        assert.equal('f1' in p, true);
        assert.equal(p.f1(), 1);
        assert.equal(p.f2(), 'tom');
        assert.equal(p.f2.call({ data: { name: 'abc' } }), 'abc');
        assert.equal('m1F1' in p, true);
        assert.isUndefined(p.m1F1());
        assert.equal(p.m1F2(), 1);
        assert.isUndefined(p.m2F1());
        assert.equal(p.m1F2(), 1);
        assert.equal(p.m2F2(), 3);
        assert.equal(p.m3F1(), 3);

        class C1 extends MpComponent {
            $mx = {
                m1: new M1(),
                m2: new M2(),
                m4: new M4()
            };
            initData = { name: 'alice' };
            f1() {
                return 2;
            }
            f2() {
                return this.data.name;
            }
        }

        const c = toMpComponentConfig(C1);
        assert.equal(Object.keys(c.data).length, 2);
        assert.equal(c.data.name, 'alice');
        assert.equal(c.data.id, 'm2');
        assert.equal('f1' in c, false);
        assert.equal('f1' in c.methods, true);
        assert.equal(c.methods.f1(), 2);
        assert.throw(() => c.methods.f2(), /undefined/);
        assert.equal(c.methods.f2.call({ data: { name: 'abc' } }), 'abc');

        assert.equal('m1F1' in c, false);
        assert.equal('m1F1' in c.methods, true);
        assert.isUndefined(c.methods.m1F1());
        assert.equal(c.methods.m1F2(), 1);
        assert.isUndefined(c.methods.m2F1());
        assert.equal(c.methods.m1F2(), 1);
        assert.equal(c.methods.m2F2(), 3);
        assert.equal(c.methods.m4F1(), 4);
    });
});
