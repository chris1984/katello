require 'katello_test_helper'

module Katello
  module Util
    class HttpProxyTest < ActiveSupport::TestCase
      include Katello::Util::HttpProxy

      def setup
        ForemanTasks.stubs(:async_task)
        @no_proxy_repo = katello_repositories(:fedora_17_x86_64_acme_dev)
        @no_proxy_repo.root.update(http_proxy_policy: RootRepository::NO_DEFAULT_HTTP_PROXY)
      end

      def test_changing_url_updates_associated_repositories
        proxy = FactoryBot.create(:http_proxy)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.update(remote_href: 'remote_href')
        repo.root.update(http_proxy_policy: Katello::RootRepository::USE_SELECTED_HTTP_PROXY,
                         http_proxy_id: proxy.id)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [repo])

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [@no_proxy_repo]).never

        proxy.update(url: 'http://foobar.com')
      end

      def test_changing_username_updates_associated_repositories
        proxy = FactoryBot.create(:http_proxy)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.update(remote_href: 'remote_href')
        repo.root.update(http_proxy_policy: Katello::RootRepository::USE_SELECTED_HTTP_PROXY,
                         http_proxy_id: proxy.id)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [repo])

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [@no_proxy_repo]).never

        proxy.update(username: 'bozo')
      end

      def test_changing_password_updates_associated_repositories
        proxy = FactoryBot.create(:http_proxy)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.update(remote_href: 'remote_href')
        repo.root.update(http_proxy_policy: Katello::RootRepository::USE_SELECTED_HTTP_PROXY,
                         http_proxy_id: proxy.id)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [repo])

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [@no_proxy_repo]).never

        proxy.update(password: 'sekr0t')
      end

      def test_missing_remotes_skips_update_http_proxy_details
        setup_default_proxy('http://foobar.com', nil, nil)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.root.update(http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY)

        global_repos = RootRepository.with_global_proxy.uniq.collect(&:library_instance).sort_by(&:pulp_id)
        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          global_repos).never

        name = Setting[:content_default_http_proxy]
        ::HttpProxy.find_by(name: name).update(password: 'sekr0t')
      end

      def test_changing_global_default_proxy_updates_associated_repositories
        setup_default_proxy('http://foobar.com', nil, nil)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.root.update(http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY)

        global_repos = RootRepository.with_global_proxy.uniq.collect(&:library_instance).sort_by(&:pulp_id)
        global_repos.each do |global_repo|
          global_repo.update(remote_href: 'remote_href')
        end
        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          global_repos)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::UpdateHttpProxyDetails,
          [@no_proxy_repo]).never

        name = Setting[:content_default_http_proxy]
        ::HttpProxy.find_by(name: name).update(password: 'sekr0t')
      end

      def test_deleting_global_default_proxy_updates_associated_repositories
        setup_default_proxy('http://foobar.com', nil, nil)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.root.update(http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY)

        global_root_repos = RootRepository.with_global_proxy.uniq.sort
        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::Update,
          global_root_repos,
          http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY,
          http_proxy_id: nil)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::Update,
          [@no_proxy_repo.root],
          http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY,
          http_proxy_id: nil).never

        name = Setting[:content_default_http_proxy]
        ::HttpProxy.find_by(name: name).destroy

        assert_equal '', Setting[:content_default_http_proxy]
      end

      def test_deleting_selected_proxy_updates_associated_repositories
        proxy = FactoryBot.create(:http_proxy)
        repo = katello_repositories(:rhel_6_x86_64)
        repo.root.update(http_proxy_policy: Katello::RootRepository::USE_SELECTED_HTTP_PROXY,
                         http_proxy_id: proxy.id)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::Update,
          [repo.root],
          http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY,
          http_proxy_id: nil)

        ForemanTasks.expects(:async_task).with(
          ::Actions::BulkAction,
          ::Actions::Katello::Repository::Update,
          [@no_proxy_repo.root],
          http_proxy_policy: Katello::RootRepository::GLOBAL_DEFAULT_HTTP_PROXY,
          http_proxy_id: nil).never

        proxy.destroy
      end

      def setup_default_proxy(url, user, pass)
        proxy = ::HttpProxy.create!(:url => url, :username => user, :password => pass, :name => url)
        Setting[:content_default_http_proxy] = proxy.name
      end

      def test_handles_no_username_test
        setup_default_proxy('http://foobar.com', nil, nil)

        assert_equal 'proxy://foobar.com:80', proxy_uri
      end

      # https://bugzilla.redhat.com/show_bug.cgi?id=1844840
      def test_properly_escapes_username_password
        setup_default_proxy('http://foobar.com', 'red!hat+', 'red@hat#$@&{}[]+%')

        assert_equal 'proxy://red%21hat%2B:red%40hat%23%24%40%26%7B%7D%5B%5D%2B%25@foobar.com:80', proxy_uri

        uri = URI.parse(proxy_uri)
        assert_equal 'red%21hat%2B', uri.user
        assert_equal 'red%40hat%23%24%40%26%7B%7D%5B%5D%2B%25', uri.password

        assert_equal 'red!hat+', ::HttpProxy.default_global_content_proxy.username
        assert_equal 'red@hat#$@&{}[]+%', ::HttpProxy.default_global_content_proxy.password
      end
    end
  end
end
