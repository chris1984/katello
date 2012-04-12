#
# Copyright 2011 Red Hat, Inc.
#
# This software is licensed to you under the GNU General Public
# License as published by the Free Software Foundation; either version
# 2 of the License (GPLv2) or (at your option) any later version.
# There is NO WARRANTY for this software, express or implied,
# including the implied warranties of MERCHANTABILITY,
# NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
# have received a copy of GPLv2 along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.

require 'spec_helper'
include OrchestrationHelper


describe SystemGroup do

  before(:each) do
    disable_org_orchestration
    @org = Organization.create!(:name => 'test_org', :cp_key => 'test_org')

  end

  context "create should" do

    it "should create succesfully with an org" do
      grp = SystemGroup.create!(:name=>"TestGroup", :organization=>@org)
      grp.pulp_id.should_not == nil
    end

    it "should not allow creation of a 2nd group in the same org with the same name" do
      grp = SystemGroup.create!(:name=>"TestGroup", :organization=>@org)
      grp2 = SystemGroup.create(:name=>"TestGroup", :organization=>@org)
      grp2.new_record?.should == true
      SystemGroup.where(:name=>"TestGroup").count.should == 1
    end

    it "should allow systems groups with the same name to be creatd in different orgs" do
      @org2 = Organization.create!(:name => 'test_org2', :cp_key => 'test_org2')
      grp = SystemGroup.create!(:name=>"TestGroup", :organization=>@org)
      grp2 = SystemGroup.create(:name=>"TestGroup", :organization=>@org2)
      grp2.new_record?.should == false
      SystemGroup.where(:name=>"TestGroup").count.should == 2
    end
  end

  context "delete should" do
    it "should delete a group succesfully" do
      grp = SystemGroup.create!(:name=>"TestGroup", :organization=>@org)
      grp.delete
      SystemGroup.where(:name=>"TestGroup").count.should == 0
    end
  end

  context "update should" do

    it "should allow the name to change" do
      grp = SystemGroup.create!(:name=>"TestGroup", :organization=>@org)
      grp.name = "NotATestGroup"
      grp.save!
      SystemGroup.where(:name=>"NotATestGroup").count.should == 1
    end
  end


end
