// import {ApiResposity} from "api";


// import {User} from "../../../cypress";

const isExist = (ele: string | string[], isExist: boolean = true) => {
  const eles = Array.isArray(ele) ? ele : [ele];
  eles.forEach(item => {
    if(isExist) {
      cy.getByTestId(item).should('exist');
    } else {
      cy.getByTestId(item).should('not.exist');
    }
  })
}

describe('contact_test', () => {
    beforeEach(() => {
      cy.on('uncaught:exception', (err) => {
        // cy.log('error caught', err);
        // debugger;
        return false
      });
      cy.login();
    });
    it('contact add personal', () => {
      // 'jump to contact'
      cy.on('uncaught:exception', (err) => {
          // cy.log('error caught', err);
          // debugger;
          return false
      });
      cy.visit('/#contact');
      cy.wait(3 * 1000);
      isExist(['contact_tree', 'tree_personalRoot', 'tree_enterpriseRoot']);
      isExist(['tree_teamRoot', 'tree_recentRoot'], false);
      const personalRootAddIcon = cy.getByTestId('tree_personalRoot_addIcon');
      // 展示添加icon
      personalRootAddIcon.should('be.hidden');
      personalRootAddIcon.invoke('attr', 'style', 'display: flex');
      personalRootAddIcon.should('be.visible');
      personalRootAddIcon.realHover();
      isExist(['tree_personalRoot_addIcon_personalContact', 'tree_personalRoot_addIcon_personalOrg', 'tree_personalRoot_addIcon_personalMark']);
      cy.getByTestId('tree_personalRoot_addIcon_personalContact').click();
      isExist(['modal_personal']);
      cy.getByTestId('modal_personal_title').should('be.visible').should('include.text', '新增联系人');
      cy.getByTestId('modal_personal_name').type('测试自动化新建联系人1');
      cy.getByTestId('modal_personal_account').type('autoTest1@test.com');
      cy.getByTestId('modal_personal_phone').type('1388880001');
      cy.getByTestId('modal_personal_remark').type('测试自动化新建联系人备注1');
      // 分组的checkbox
      const personalOrg = cy.getByTestIds({selector: ['modal_personal_personalOrg', 'modal_personal_personalOrg_item_checkbox'], index: 1});
      // 选中分组
      personalOrg.click();
      // 确认是否选中分组
      personalOrg.should('have.attr', 'data-test-check', 'true');
      // 点击提交
      cy.getByTestId('modal_personal_btn_save').realMouseDown();
  })
})
