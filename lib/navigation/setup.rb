
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
module Navigation
  module SetupMenu

    def menu_setup
      menu = {:key => :systems,
       :name => _("Setup"),
        :url => :sub_level,
        :options => {:class=>'setup top_level', "data-menu"=>"setup"},
        :items=> [ menu_subnets ]
        # TODO: final order of the setup menu items
        #   Setup
        #   Locations
        #   Smart Proxies
        #   Subnets
        #   Domains
        #   Hardware Models
      }
      menu
    end

    def menu_subnets
      {:key => :registered,
       :name => _("Subnets"),
       :url => subnets_path,
       :if => lambda{true}, #TODO: check permissions
       :options => {:class=>'setup second_level', "data-menu"=>"subnets"}
      }
    end


  end
end
